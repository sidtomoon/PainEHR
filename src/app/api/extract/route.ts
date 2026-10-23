import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are an expert clinical data extraction assistant for an Indian pain medicine hospital clinic / OPD registry. Extract structured clinical fields from the capture provided (which may contain PDF documents, hospital OPD registration cards, handwritten doctor notes, prescription slips, lab/MRI reports, discharge summaries, or a dictated voice transcript).

Indian hospital OPD cards (such as from PGI Chandigarh, AIIMS, GMCH, civil hospitals, or private pain clinics) typically contain:
1. Patient Demographics & Hospital Registration:
   - CR No. / Reg No. / OPD No. / UHID / File No. (e.g. "CR No: 20240123456", "CR-9872", "OPD: 10452")
   - Patient Name (e.g. "Sunita Devi", "Rajesh Kumar")
   - Age (number, e.g. 45)
   - Sex ("M", "F", or "Other")
   - Phone / Mobile number (e.g. 10-digit Indian phone number)
2. Clinical History & Assessment:
   - Encounter Type: "new" (first visit/new card), "followup" (subsequent review), "procedure" (intervention day), or "other"
   - Chief Complaint (e.g. "Low back pain with right leg radiation x 6 months")
   - Diagnosis (e.g. "L4-L5 Lumbar Disc Herniation with Radiculopathy", "Facet Arthropathy", "Trigeminal Neuralgia")
   - Pain Location: choose strictly from: "cervical", "lumbar", "thoracic", "shoulder", "hip", "knee", "neuropathic", "widespread", "other"
   - Pain Score NRS (0 to 10 integer, if mentioned)
3. Outcomes & Functional Assessment (0 to 10 scale, where 0 is normal/best and 10 is worst/disabled):
   - Function Score (0 = full normal mobility, 10 = bedbound/disabled)
   - Mood Score (0 = calm/no distress, 10 = severe anxiety/depression)
   - Sleep Score (0 = peaceful sleep, 10 = severe pain-induced insomnia)
   - Quality of Life / QoL Score (0 = excellent, 10 = poorest quality of life)
4. Management & Prescription:
   - Procedure (e.g. "L4-L5 Transforaminal Epidural Steroid Injection", "Bilateral Knee Genicular RFA")
   - Plan / Medications / Dosages (e.g. "Tab Pregabalin 75mg HS x 14 days, Tab Methylcobalamin 1500mcg OD x 30 days, Physiotherapy core strengthening")
   - Clinical Notes / Precautions (e.g. "Avoid forward bending, lumbar support belt, review after 2 weeks")

When multiple documents or images are provided (e.g. an OPD Registration Card, a Doctor Prescription slip, or an attached MRI/lab PDF report), synthesize the information across all items together: take demographics from the registration card and medications/plan/diagnosis from the prescription slip and reports!

Never hallucinate or invent information. If a field is not stated or is illegible, set it to null and mark its confidence as "low".
Respond with ONLY a valid raw JSON object (no markdown code blocks, no preamble, no commentary) matching this schema:
{
  "demographics": {
    "cr_no": string | null,
    "name": string | null,
    "age": number | null,
    "sex": "M" | "F" | "Other" | null,
    "phone": string | null
  },
  "encounter_type": "new" | "followup" | "procedure" | "other",
  "chief_complaint": string | null,
  "diagnosis": string | null,
  "pain_location": "cervical" | "lumbar" | "thoracic" | "shoulder" | "hip" | "knee" | "neuropathic" | "widespread" | "other" | null,
  "pain_score_nrs": number | null,
  "function_score_0_10": number | null,
  "mood_score_0_10": number | null,
  "sleep_score_0_10": number | null,
  "qol_score_0_10": number | null,
  "procedure": string | null,
  "plan": string | null,
  "notes": string | null,
  "confidence": {
    "demographics": "high" | "medium" | "low",
    "chief_complaint": "high" | "medium" | "low",
    "diagnosis": "high" | "medium" | "low",
    "pain_location": "high" | "medium" | "low",
    "pain_score_nrs": "high" | "medium" | "low",
    "procedure": "high" | "medium" | "low",
    "plan": "high" | "medium" | "low"
  }
}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    return NextResponse.json(
      {
        error:
          'AI extraction is not configured. Please set GEMINI_API_KEY in your environment variables or Vercel dashboard.',
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const {
    mode,
    transcript,
    imageBase64,
    mediaType,
    images,
  } = body as {
    mode: 'photo' | 'voice';
    transcript?: string;
    imageBase64?: string;
    mediaType?: string;
    images?: Array<{ base64: string; mediaType: string; name?: string }>;
  };

  // Normalize images list
  const imageList: Array<{ base64: string; mediaType: string }> = [];
  if (Array.isArray(images) && images.length > 0) {
    for (const img of images) {
      if (img.base64) {
        imageList.push({
          base64: img.base64,
          mediaType: img.mediaType || 'image/jpeg',
        });
      }
    }
  } else if (imageBase64) {
    imageList.push({
      base64: imageBase64,
      mediaType: mediaType || 'image/jpeg',
    });
  }

  try {
    let parsed: Record<string, unknown> | null = null;

    // 1. Primary Engine: Google Gemini Flash
    if (geminiKey) {
      const parts: Record<string, unknown>[] = [];

      if (mode === 'photo' && imageList.length > 0) {
        // Add all image parts
        for (let i = 0; i < imageList.length; i++) {
          const img = imageList[i];
          parts.push({
            inlineData: {
              mimeType: img.mediaType,
              data: img.base64,
            },
          });
        }
        parts.push({
          text: `Extract all patient demographics (CR No, Name, Age, Sex, Phone), clinical findings, Function/Mood/Sleep/QoL scores, and treatment plan across all ${imageList.length} attached clinical pages, documents, or PDF reports as instructed.`,
        });
      } else {
        parts.push({
          text: `Dictated clinical encounter transcript:\n"""\n${transcript || ''}\n"""\n\nExtract all patient demographics, clinical fields, Function/Mood/Sleep/QoL scores, and management plan as instructed.`,
        });
      }

      // Try gemini-2.0-flash first, then gemini-1.5-flash
      const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{ role: 'user', parts }],
                generationConfig: { responseMimeType: 'application/json' },
              }),
            },
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const clean = candidateText
                .trim()
                .replace(/^```json/i, '')
                .replace(/^```/, '')
                .replace(/```$/, '')
                .trim();
              parsed = JSON.parse(clean);
              break; // Success!
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`Gemini (${model}) returned status ${geminiRes.status}:`, errText);
          }
        } catch (modelErr) {
          console.warn(`Error calling Gemini model ${model}:`, modelErr);
        }
      }
    }

    // 2. Fallback to Anthropic Claude only if Gemini is not configured or failed
    if (!parsed && anthropicKey) {
      try {
        const content: Array<Record<string, unknown>> = [];
        if (mode === 'photo' && imageList.length > 0) {
          for (const img of imageList) {
            if (img.mediaType === 'application/pdf') {
              content.push({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: img.base64,
                },
              });
            } else {
              content.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: img.mediaType,
                  data: img.base64,
                },
              });
            }
          }
          content.push({
            type: 'text',
            text: `Extract all patient demographics and clinical fields across all ${imageList.length} attached documents and photos as instructed.`,
          });
        } else {
          content.push({
            type: 'text',
            text: `Dictated encounter transcript:\n"""\n${transcript || ''}\n"""\n\nExtract the structured fields as instructed.`,
          });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content }],
          }),
        });

        const data = await response.json();
        if (!data.error) {
          const textBlock = (data.content || []).find((b: { type: string }) => b.type === 'text');
          if (textBlock && textBlock.text) {
            const raw = textBlock.text
              .trim()
              .replace(/^```json/i, '')
              .replace(/^```/, '')
              .replace(/```$/, '')
              .trim();
            parsed = JSON.parse(raw);
          }
        }
      } catch (anthropicErr) {
        console.warn('Anthropic fallback error:', anthropicErr);
      }
    }

    if (!parsed) {
      throw new Error(
        'AI extraction could not process the provided media. Please ensure GEMINI_API_KEY is configured and the image is clear.',
      );
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong during extraction.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

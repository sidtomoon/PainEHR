import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PubMedSummaryItem {
  uid: string;
  title?: string;
  source?: string;
  pubdate?: string;
  sortfirstauthor?: string;
  authors?: Array<{ name: string }>;
  articleids?: Array<{ idtype: string; value: string }>;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  journal: string;
  pubDate: string;
  authors: string[];
  doi: string | null;
  url: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      diagnosis = '',
      painLocation = '',
      painMechanism = '',
      procedure = '',
      customQuery = '',
      filterType = 'all', // 'all' | 'guidelines' | 'reviews' | 'trials'
    } = body;

    // Build the query terms
    let baseQuery = customQuery.trim();
    if (!baseQuery) {
      const topicParts = [
        diagnosis,
        procedure,
        painLocation ? `${painLocation} pain` : '',
        painMechanism && painMechanism !== 'mixed' ? painMechanism : '',
      ].filter(Boolean);

      if (topicParts.length === 0) {
        baseQuery = 'interventional pain management';
      } else {
        baseQuery = topicParts.join(' ');
      }
    }

    // Add filter modifiers for specific clinical evidence types
    let filterModifier = '';
    if (filterType === 'guidelines') {
      filterModifier = ' AND (practice guideline[Publication Type] OR guideline*[Title] OR consensus[Title/Abstract])';
    } else if (filterType === 'reviews') {
      filterModifier = ' AND (systematic review[Publication Type] OR meta-analysis[Publication Type])';
    } else if (filterType === 'trials') {
      filterModifier = ' AND (randomized controlled trial[Publication Type] OR clinical trial[Publication Type])';
    } else {
      filterModifier = ' AND (pain management OR therapy OR intervention OR guideline)';
    }

    const fullTerm = `${baseQuery}${filterModifier}`;
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      fullTerm
    )}&retmode=json&retmax=5&sort=pub_date`;

    // 1. Search for PMIDs
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'PainEHR/1.0 (Clinical Decision Support)' },
      next: { revalidate: 3600 }, // Cache search queries for 1 hour
    });

    if (!searchRes.ok) {
      throw new Error(`NCBI E-Utilities search returned status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const idList: string[] = searchData?.esearchresult?.idlist || [];

    if (idList.length === 0) {
      // Fallback: search with broader term if specific filter returned 0
      if (filterType !== 'all') {
        const broadUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
          baseQuery
        )}&retmode=json&retmax=5&sort=pub_date`;
        const broadRes = await fetch(broadUrl, {
          headers: { 'User-Agent': 'PainEHR/1.0 (Clinical Decision Support)' },
        });
        const broadData = await broadRes.json();
        const fallbackIds: string[] = broadData?.esearchresult?.idlist || [];
        if (fallbackIds.length > 0) {
          idList.push(...fallbackIds);
        }
      }
    }

    if (idList.length === 0) {
      return NextResponse.json({ articles: [], query: fullTerm });
    }

    // 2. Fetch document summaries for PMIDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(
      ','
    )}&retmode=json`;

    const summaryRes = await fetch(summaryUrl, {
      headers: { 'User-Agent': 'PainEHR/1.0 (Clinical Decision Support)' },
      next: { revalidate: 3600 },
    });

    if (!summaryRes.ok) {
      throw new Error(`NCBI E-Utilities summary returned status ${summaryRes.status}`);
    }

    const summaryData = await summaryRes.json();
    const resultObj = summaryData?.result || {};

    const articles: PubMedArticle[] = idList
      .map((pmid) => {
        const item: PubMedSummaryItem | undefined = resultObj[pmid];
        if (!item) return null;

        const doiObj = (item.articleids || []).find((id) => id.idtype === 'doi');
        const authors = (item.authors || []).map((a) => a.name).slice(0, 3);
        if ((item.authors || []).length > 3) {
          authors.push('et al.');
        }

        return {
          pmid,
          title: (item.title || 'Untitled PubMed Article').replace(/\.$/, ''),
          journal: item.source || 'PubMed Central',
          pubDate: item.pubdate || 'Recent',
          authors,
          doi: doiObj ? doiObj.value : null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
      })
      .filter((a): a is PubMedArticle => a !== null);

    return NextResponse.json({
      articles,
      query: baseQuery,
      totalFound: searchData?.esearchresult?.count || articles.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to query PubMed API';
    console.error('PubMed NCBI API error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

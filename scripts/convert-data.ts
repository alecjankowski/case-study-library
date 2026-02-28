import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const AWARDS_DIR = '/root/.openclaw/workspace/awards-db';
const OUTPUT_FILE = './src/lib/cases.json';

interface CaseStudy {
  slug: string;
  title: string;
  brand: string;
  agency: string;
  year: string;
  award: string;
  category: string;
  insight: string;
  coreIdea: string;
  execution: string;
  results: string;
  qualityScore: number;
}

function parseFilename(filename: string): { year: string; award: string; brand: string } {
  const name = filename.replace('.md', '');
  const parts = name.split('---');
  
  let year = '';
  let award = '';
  let brand = parts[parts.length - 1].replace(/-/g, ' ').trim() || '';
  
  if (parts.length >= 1) {
    const left = parts[0];
    
    // Extract year (handles ranges like 1954-1999)
    const yearMatch = left.match(/^(\d{4})(?:-\d{4})?/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    // Extract award level
    const leftLower = left.toLowerCase();
    if (leftLower.includes('grand prix') || leftLower.includes('titanium')) {
      award = 'Grand Prix/Titanium';
    } else if (leftLower.includes('gold')) {
      award = 'Gold';
    } else if (leftLower.includes('silver')) {
      award = 'Silver';
    } else if (leftLower.includes('bronze')) {
      award = 'Bronze';
    }
  }
  
  return { year, award, brand };
}

function calculateQuality(c: CaseStudy): number {
  let score = 0;
  
  // Metadata (3 points)
  if (c.brand && c.brand.length > 1) score += 1;
  if (c.year && c.year.length >= 4) score += 1;
  if (c.agency && c.agency.length > 2) score += 1;
  
  // Content (4 points)
  if (c.insight && c.insight.length > 30 && !c.insight.toLowerCase().includes('not available')) score += 1;
  if (c.coreIdea && c.coreIdea.length > 30 && !c.coreIdea.toLowerCase().includes('not available')) score += 1;
  if (c.execution && c.execution.length > 30 && !c.execution.toLowerCase().includes('not available')) score += 1;
  if (c.results && c.results.length > 30 && !c.results.toLowerCase().includes('not available')) score += 1;
  
  return Math.min(100, score * 14); // Max 98, close enough to 100
}

const cases: CaseStudy[] = [];
const files = fs.readdirSync(AWARDS_DIR).filter(f => f.endsWith('.md'));

console.log(`Processing ${files.length} files...`);

for (const file of files) {
  const filepath = path.join(AWARDS_DIR, file);
  const content = fs.readFileSync(filepath, 'utf-8');
  const { data, content: body } = matter(content);
  
  if (!body) continue;
  
  // Parse filename for metadata
  const { year: filenameYear, award: filenameAward, brand: filenameBrand } = parseFilename(file);
  
  // Extract fields from frontmatter (priority) or filename
  const brand = data['Brand / Client'] || data.brand || filenameBrand || '';
  const agency = data.agency || data.Agency || '';
  const year = data.year || data.Year || filenameYear || '';
  const award = data.award_level || data.award || data['Award'] || filenameAward || '';
  const category = data.category || data.Category || '';
  
  // Extract sections from body
  const sections = body.split(/^## /m);
  let insight = '', coreIdea = '', execution = '', results = '';
  
  for (const section of sections) {
    if (section.startsWith('Insight')) {
      insight = section.replace('Insight', '').trim();
    } else if (section.startsWith('Core Creative Idea')) {
      coreIdea = section.replace('Core Creative Idea', '').trim();
    } else if (section.startsWith('Execution')) {
      execution = section.replace('Execution', '').trim();
    } else if (section.startsWith('Results')) {
      results = section.replace('Results', '').trim();
    }
  }
  
  // Get title from first line
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
  
  const caseStudy: CaseStudy = {
    slug: file.replace('.md', ''),
    title,
    brand,
    agency,
    year,
    award,
    category,
    insight,
    coreIdea,
    execution,
    results,
    qualityScore: calculateQuality({
      brand, agency, year, award, insight, coreIdea, execution, results
    } as CaseStudy)
  };
  
  cases.push(caseStudy);
}

// Sort by quality score descending
cases.sort((a, b) => b.qualityScore - a.qualityScore);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cases, null, 2));
console.log(`✓ Generated ${cases.length} case studies`);
console.log(`  High quality (70+): ${cases.filter(c => c.qualityScore >= 70).length}`);
console.log(`  Medium quality (40-69): ${cases.filter(c => c.qualityScore >= 40 && c.qualityScore < 70).length}`);
console.log(`  Low quality (<40): ${cases.filter(c => c.qualityScore < 40).length}`);

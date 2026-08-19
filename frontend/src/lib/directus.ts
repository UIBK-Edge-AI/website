import type {
  Member,
  Project,
  Publication,
  Thesis,
  TeachingCourse,
  Vacancy,
  SiteSettings,
  NewsEvent
} from './types';

// Fallback static datasets
import membersFallback from '../data/fallback/members.json';
import projectsFallback from '../data/fallback/projects.json';
import publicationsFallback from '../data/fallback/publications.json';
import thesesFallback from '../data/fallback/theses.json';
import teachingFallback from '../data/fallback/teaching.json';
import vacanciesFallback from '../data/fallback/vacancies.json';
import siteSettingsFallback from '../data/fallback/site_settings.json';

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'http://localhost:8055';

async function fetchFromDirectus<T>(collection: string, fallbackData: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout

    const res = await fetch(`${DIRECTUS_URL}/items/${collection}?limit=-1`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as T;
      } else if (json.data && typeof json.data === 'object') {
        return json.data as T;
      }
    }
  } catch (error) {
    // Graceful fallback during offline development or builds
  }
  return fallbackData;
}

export async function getMembers(): Promise<Member[]> {
  const data = await fetchFromDirectus<Member[]>('members', membersFallback as unknown as Member[]);
  const priority: Record<string, number> = {
    'PROFESSOR': 1,
    'POSTDOCTORAL RESEARCHERS': 2,
    'SYSTEMS ENGINEER': 3,
    'PHD STUDENTS': 4,
    'STUDENTS': 5,
    'ALUMNI': 6
  };
  return [...data].sort((a, b) => (priority[a.category] || 99) - (priority[b.category] || 99) || (a.sort_order - b.sort_order));
}

export async function getProjects(): Promise<Project[]> {
  const data = await fetchFromDirectus<Project[]>('projects', projectsFallback as unknown as Project[]);
  return [...data].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getPublications(): Promise<Publication[]> {
  const data = await fetchFromDirectus<Publication[]>('publications', publicationsFallback as unknown as Publication[]);
  return [...data].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export async function getTheses(): Promise<Thesis[]> {
  return await fetchFromDirectus<Thesis[]>('theses', thesesFallback as unknown as Thesis[]);
}

export async function getTeaching(): Promise<TeachingCourse[]> {
  return await fetchFromDirectus<TeachingCourse[]>('teaching_courses', teachingFallback as unknown as TeachingCourse[]);
}

export async function getVacancies(): Promise<Vacancy[]> {
  return await fetchFromDirectus<Vacancy[]>('vacancies', vacanciesFallback as unknown as Vacancy[]);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await fetchFromDirectus<SiteSettings>('site_settings', siteSettingsFallback as unknown as SiteSettings);
  return data;
}

export async function getNewsEvents(): Promise<NewsEvent[]> {
  const fallbackNews: NewsEvent[] = [
    {
      id: 1,
      title: "Edge AI Group participates in Lange Nacht der Forschung 2026",
      slug: "lndf-2026",
      date: "2026-05-24",
      category: "Event",
      summary: "Our research group presented live demonstrations of edge computing and distributed AI intelligence to hundreds of visitors.",
      cover_image_path: "/images/homepage/LNDF.jpeg"
    },
    {
      id: 2,
      title: "Visiting Professor Rus from University of Memphis",
      slug: "visiting-prof-rus",
      date: "2026-04-12",
      category: "Talk",
      summary: "Informal meeting and collaborative seminar on graph neural networks and edge-cloud computing.",
      cover_image_path: "/images/homepage/meeting_prof_rus.jpeg"
    },
    {
      id: 3,
      title: "Paper accepted at IEEE Cloud 2025: EnergyLess Framework",
      slug: "paper-energyless-ieee-cloud",
      date: "2025-11-15",
      category: "Award",
      summary: "Our paper on energy-aware serverless workflow batch orchestration across the computing continuum has been accepted.",
      cover_image_path: "/images/homepage/edge_computing.png"
    }
  ];
  return await fetchFromDirectus<NewsEvent[]>('news_events', fallbackNews);
}

export interface MemberPosition {
  from: number | string;
  to?: number | string;
  title: string;
  dep?: string;
  dep_uri?: string;
  inst: string;
  inst_uri?: string;
  where: string;
  notes?: string;
}

export interface MemberEducation {
  year?: number | string;
  from?: number | string;
  to?: number | string;
  title: string;
  inst: string;
  inst_uri?: string;
  where: string;
}

export interface Member {
  id: number;
  status: 'published' | 'draft' | 'archived';
  member_status: 'active' | 'alumni';
  title: string;
  name: string;
  lastname: string;
  slug: string;
  category: 'PROFESSOR' | 'POSTDOCTORAL RESEARCHERS' | 'PHD STUDENTS' | 'SYSTEMS ENGINEER' | 'STUDENTS' | 'ALUMNI' | string;
  position: string;
  sort_order: number;
  office: string;
  phone: string;
  email: string;
  address: string;
  orcid?: string;
  scholar_id?: string;
  linkedin?: string;
  github?: string;
  avatar_path: string;
  interests: string[];
  positions: MemberPosition[];
  education: MemberEducation[];
  bio: string;
  publications?: string[];
}

export interface Project {
  id: number;
  status: string;
  project_status: 'ongoing' | 'completed';
  name: string;
  title: string;
  slug: string;
  identifier: string;
  sponsor: string;
  duration: string;
  website?: string;
  cover_image_path: string;
  sort_order: number;
  tags: string[];
  researchers: string[];
  summary: string;
  content: string;
}

export interface Publication {
  id: number;
  bibtex_key: string;
  pubtype: 'journal' | 'conference' | 'workshop' | 'book' | 'preprint' | string;
  title: string;
  authors: string;
  author_list: string[];
  year: number;
  venue: string;
  volume?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  pdf_url?: string;
  keywords: string[];
  abstract?: string;
  bibtex_raw: string;
}

export interface Thesis {
  id: number;
  title: string;
  slug: string;
  degree: 'bachelor' | 'master' | 'phd' | 'internship' | string;
  thesis_status: 'open' | 'ongoing' | 'completed' | string;
  author?: string;
  supervisors: string;
  start_date?: string;
  submission_date?: string;
  pdf_url?: string;
  abstract: string;
}

export interface TeachingCourse {
  id: number;
  title: string;
  course_type: 'VO' | 'PS' | 'VU' | 'SE' | 'PR' | string;
  degree: 'ba-cs' | 'ma-cs' | 'phd' | string;
  semester: string;
  room: string;
  instructors: string;
  redirect_to?: string;
  description: string;
}

export interface Vacancy {
  id: number;
  title: string;
  slug: string;
  position_type: 'phd' | 'postdoc' | 'student_assistant' | 'researcher' | string;
  vacancy_status: 'open' | 'closed' | string;
  area: string;
  start_date: string;
  duration: string;
  contact_name: string;
  contact_email: string;
  content: string;
}

export interface CarouselImage {
  image: string;
  caption: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  employer: string;
  location: string;
  email: string;
  telephone: string;
  location_map_url: string;
  motivation: string;
  acknowledgments: string;
  research_topics: string[];
  carousel_images: CarouselImage[];
}

export interface NewsEvent {
  id: number;
  title: string;
  slug: string;
  date: string;
  category: 'News' | 'Event' | 'Award' | 'Talk' | string;
  summary: string;
  cover_image_path?: string;
  external_url?: string;
  content?: string;
}

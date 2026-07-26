# EEOS Learning Management System (LMS) Engine

## Overview

The LMS provides enterprise course management integrated with the EEOS platform.

## Architecture

```
LMS (lmsEngine.ts + lmsPlatform.ts)
├── Course Library
├── Lessons & Topics
├── Quizzes & Questions
├── Assignments & Submissions
├── Announcements & Discussions
├── Certificates
├── Content Uploads
├── Enrollments & Progress
└── Analytics

Integrations:
├── Academic (subjects, batches, sessions)
├── Student (studentMaster)
├── People Registry
├── Communication
├── Dashboard Providers
├── Query Platform
└── Event Pipeline
```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/lms` | LMSDashboard | Executive dashboard with course/lesson/enrollment KPIs |
| `/lms/courses` | CourseLibrary | Course listing with search, filters, stat cards |
| `/lms/courses/:courseId` | CourseWorkspace | Course detail with 6 tabs |
| `/lms/lessons/:lessonId` | LessonWorkspace | Lesson detail with content viewer |

## CourseWorkspace Tabs

| Tab | Description |
|-----|-------------|
| **Lessons** | Ordered lesson list with published/draft status |
| **Assignments** | Assignment list with score config |
| **Quizzes** | Quiz list with pass % and attempts |
| **Announcements** | Priority-based announcements |
| **Discussions** | Course discussion threads |
| **Content** | Uploaded files and materials |

## LessonWorkspace

- **Content Tab** — Video/PDF/Slides viewer or text content renderer
- **Topics Tab** — Ordered topic list with content type icons
- **Assignments Tab** — Related assignments with scores and due dates
- **Quizzes Tab** — Related quizzes with passing config

## Backend APIs

### Courses
- `lmsEngine.listCourses` — Filterable course list (by status, instructor, difficulty)
- `lmsEngine.getCourse` — Full course with lessons
- `lmsEngine.createCourse`, `lmsEngine.updateCourse`, `lmsEngine.publishCourse`

### Lessons
- `lmsEngine.listLessons` — Lessons with topics enrichment
- `lmsEngine.getLesson` — Full lesson with topics, assignments, quizzes
- `lmsEngine.createLesson`, `lmsEngine.updateLesson`, `lmsEngine.publishLesson`

### Quizzes & Assignments
- `lmsFacultyEngine.listQuizzes`, `lmsFacultyEngine.getQuizWithQuestions`
- `lmsFacultyEngine.listAssignments`, `lmsFacultyEngine.listSubmissions`
- `lmsFacultyEngine.createQuiz`, `lmsFacultyEngine.createAssignment`
- `lmsFacultyEngine.evaluateSubmission`

### Analytics
- `lmsEngine.getLMSDashboard` — Course/lesson/enrollment KPIs
- `lmsPlatform.getLmsAnalytics` — Full analytics with course-level data
- `lmsPlatform.getFacultyCourseAnalytics` — Per-faculty analytics

## UI Coverage

| Feature | Status |
|---------|--------|
| LMS Dashboard | ✅ Complete |
| Course Library | ✅ New |
| Course Workspace | ✅ New |
| Lesson Workspace | ✅ New |
| Student Progress | 🔶 Planned |
| Faculty Analytics | 🔶 Planned |
| Question Bank UI | 🔶 Planned |
| Certificates | 🔶 Planned |
| Mobile Ready | 🔶 APIs exist |

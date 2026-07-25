# Learning Management System — Enterprise Guide

## Overview

The EEOS LMS is a complete Learning Management System integrated with the Academic Engine, Student Engine, People Registry, Workflow Engine, Notification Engine, Timeline Engine, and Dashboard Studio. It supports course creation, lesson delivery, assignments, quizzes, discussion forums, progress tracking, and certificate issuance.

## Architecture

```
LMS Platform
│
├── Course Library
│   ├── lmsCourses       → Course metadata, difficulty, status
│   ├── lmsLessons       → Lesson content (video/pdf/text/quiz/assignment)
│   ├── lmsTopics        → Sub-lesson content blocks
│   └── lmsContentUploads → Faculty content upload repository
│
├── Assessment
│   ├── lmsQuestionBank  → Reusable question repository
│   ├── lmsQuizzes       → Quiz definitions with configurable rules
│   ├── lmsQuizQuestions → Questions assigned to quizzes
│   └── lmsQuizAttempts  → Student quiz attempts and scores
│
├── Assignments
│   ├── lmsAssignments   → Faculty-created assignments
│   └── lmsSubmissions   → Student submissions + evaluations
│
├── Communication
│   ├── lmsDiscussions   → Course/lesson discussion forums
│   └── lmsAnnouncements → Course announcements
│
├── Progress & Enrollment
│   ├── lmsEnrollments   → Student course enrollments
│   └── lmsLessonProgress → Per-lesson tracking
│
├── Certification
│   └── lmsCertificates  → Issued certificates
│
└── Analytics
    ├── getLmsAnalytics  → Platform-wide analytics
    └── getFacultyCourseAnalytics → Faculty-specific analytics
```

## Database Tables (16)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `lmsCourses` | Course master | title, code, instructorId, difficulty, status, enrolledCount |
| `lmsLessons` | Lesson content | courseId, title, contentType, orderIndex, isPublished |
| `lmsTopics` | Sub-lesson content | lessonId, title, contentType, contentUrl, orderIndex |
| `lmsContentUploads` | Faculty uploads | courseId, lessonId, fileName, fileType, fileUrl |
| `lmsEnrollments` | Student enrollments | courseId, studentId, progress, status |
| `lmsLessonProgress` | Lesson tracking | lessonId, studentId, completed, lastAccessedAt |
| `lmsQuestionBank` | Reusable questions | courseId, question, questionType, difficulty, tags |
| `lmsQuizzes` | Quiz definitions | lessonId, courseId, passingPercentage, timeLimit |
| `lmsQuizQuestions` | Quiz-question mapping | quizId, question, questionType, points, orderIndex |
| `lmsQuizAttempts` | Quiz attempts | quizId, studentId, score, percentage, passed |
| `lmsAssignments` | Assignment definitions | lessonId, courseId, maxScore, passingScore, dueDate |
| `lmsSubmissions` | Student submissions | assignmentId, studentId, score, status |
| `lmsDiscussions` | Discussion threads | courseId, lessonId, authorId, parentId |
| `lmsAnnouncements` | Course announcements | courseId, title, content, priority |
| `lmsCertificates` | Issued certificates | courseId, studentId, certificateNumber, issuedAt |

## Workflow States

### Course Lifecycle
```
Draft → Published → Archived
```

### Lesson Lifecycle
```
Created → Published (via publishLesson)
```

### Assignment Lifecycle
```
Draft → Published → Closed
```

### Quiz Lifecycle
```
Draft → Published → Closed
```

### Enrollment Lifecycle
```
Enrolled → In Progress → Completed
                        → Dropped
```

### Submission Lifecycle
```
Submitted → Evaluated → Passed
                     → Failed
          → Resubmitted
```

## API Reference

### Course Management (`lmsEngine.ts`, `lmsPlatform.ts`)

| Mutation | Description |
|----------|-------------|
| `createCourse(args)` | Create a new course (event-wired) |
| `updateCourse(args)` | Update course metadata |
| `publishCourse({ id })` | Publish a course (event-wired) |
| `listCourses(filter)` | List courses with filters |
| `getCourse({ id })` | Get course with lessons |

### Lesson Management (`lmsEngine.ts`, `lmsPlatform.ts`)

| Mutation | Description |
|----------|-------------|
| `createLesson(args)` | Create a lesson (event-wired) |
| `updateLesson(args)` | Update lesson content |
| `publishLesson({ id })` | Publish a lesson (event-wired) |
| `listLessons({ courseId })` | List course lessons |
| `getLesson({ id })` | Get lesson with topics/assignments/quizzes |

### Topic Management (`lmsEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createTopic(args)` | Create a topic within a lesson |
| `updateTopic(args)` | Update topic content |

### Assignment Management (`lmsFacultyEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createAssignment(args)` | Create an assignment |
| `publishAssignment({ id })` | Publish an assignment |
| `evaluateSubmission(args)` | Evaluate a student submission |
| `listAssignments(filter)` | List assignments |
| `listSubmissions(filter)` | List submissions with enrichment |

### Quiz Management (`lmsFacultyEngine.ts`, `lmsPlatform.ts`)

| Mutation | Description |
|----------|-------------|
| `createQuiz(args)` | Create a quiz |
| `addQuizQuestion(args)` | Add a question to a quiz |
| `publishQuiz({ id })` | Publish a quiz |
| `submitQuizAttempt(args)` | Student submits quiz attempt |
| `getQuizAttempts(filter)` | Get student quiz attempts |

### Question Bank (`lmsPlatform.ts`) — New

| Mutation | Description |
|----------|-------------|
| `createQuestionBankItem(args)` | Add to reusable question bank |
| `updateQuestionBankItem(args)` | Update a question bank item |
| `deleteQuestionBankItem({ id })` | Delete from question bank |
| `listQuestionBank(filter)` | Search question bank by course/type/difficulty/tags |
| `importQuestionsFromBank({ quizId, questionIds })` | Import bank questions into a quiz |

### Announcements & Discussions (`lmsEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createAnnouncement(args)` | Create course announcement |
| `listAnnouncements({ courseId })` | List course announcements |
| `createDiscussion(args)` | Start a discussion thread |
| `listDiscussions(filter)` | List discussions |

### Student Operations (`lmsStudentEngine.ts`, `lmsPlatform.ts`)

| Mutation | Description |
|----------|-------------|
| `enrollStudent(args)` | Enroll student in course (event-wired) |
| `trackLessonProgress(args)` | Track lesson completion |
| `submitAssignment(args)` | Submit assignment |
| `getStudentEnrollments({ studentId })` | Get student's courses |
| `getStudentProgress(filter)` | Get detailed progress |
| `getStudentDashboard({ studentId })` | Student dashboard stats |

### Certificate Management (`lmsPlatform.ts`) — New

| Mutation | Description |
|----------|-------------|
| `issueCertificate(args)` | Issue a course completion certificate |
| `listCertificates(filter)` | List certificates by course/student |

### Content Uploads (`lmsPlatform.ts`) — New

| Mutation | Description |
|----------|-------------|
| `recordContentUpload(args)` | Record a faculty content upload |
| `listContentUploads(filter)` | List content uploads |
| `deleteContentUpload({ id })` | Delete content record |

### Analytics (`lmsPlatform.ts`)

| Query | Description |
|-------|-------------|
| `getLmsAnalytics()` | Platform-wide LMS analytics |
| `getFacultyCourseAnalytics({ facultyId })` | Faculty-specific analytics |

### Legacy Dashboards

| Query | File | Description |
|-------|------|-------------|
| `getLMSDashboard()` | `lmsEngine.ts` | Platform dashboard |
| `getFacultyDashboard({ facultyId })` | `lmsFacultyEngine.ts` | Faculty dashboard |
| `getStudentDashboard({ studentId })` | `lmsStudentEngine.ts` | Student dashboard |

## Platform Integration

### Event Pipeline
Critical mutations in `lmsPlatform.ts` automatically fire:
- Audit Log
- Timeline Event
- Activity Record
- Event Bus Event

Event types: `lms.course.*`, `lms.lesson.*`, `lms.enrollment.*`, `lms.quiz.*`, `lms.certificate.*`, `lms.question_bank.*`, `lms.content_upload.*`

### Dashboard Provider
Registered as `lms` provider with KPIs for Courses, Lessons, Enrollments, Pending Assignments, and Charts by status/difficulty.

### Seed Data
Run `seedLms()` mutation to create sample courses, lessons, topics, quizzes, and enrollments.

# Kura — Project TODO

## Design System & Foundation
- [ ] Define elegant health-themed design tokens (colors, typography, shadows) in index.css
- [ ] Add Google Fonts (serif display + clean sans) in index.html
- [ ] Update app title/branding to "Kura" consistently

## Database Schema
- [ ] careGroups table (a family/care unit)
- [ ] careGroupMembers table (user <-> group, role, permissions)
- [ ] patients table (the person being cared for, per group)
- [ ] appointments table (calendar: doctor, home care, physio, pharmacy)
- [ ] medicalLog table (medication, symptom, vitals, wellbeing entries)
- [ ] tasks table (assign, track care responsibilities)
- [ ] documents table (prescriptions, POA, reports — S3 refs)
- [ ] timelineEvents table (diagnoses, treatments, history)
- [ ] notifications table (per care group / user)
- [ ] invitations table (invite family members to a group)

## Authentication & Roles
- [ ] Manus OAuth login/register flow
- [ ] Three roles: family_member, patient, care_coordinator
- [ ] Role-based access control on views and procedures
- [ ] Onboarding: create or join a care group, select role

## Landing Page
- [ ] Hero with value props for caregivers + patients
- [ ] Feature sections, role differentiation
- [ ] Prominent Login + Register CTAs

## Caregiver Dashboard
- [ ] Dashboard overview (upcoming appts, recent log, open tasks, notifications)
- [ ] Shared calendar (schedule/view appointments by category)
- [ ] Medical log (record + track meds/symptoms/vitals/wellbeing, timestamps)
- [ ] Task management (assign, track, complete)

## Documents
- [ ] Secure document upload (S3 via storagePut)
- [ ] Categorize: prescription, power of attorney, medical report
- [ ] Scoped per care group

## Health Timeline (Patient)
- [ ] Visual chronological timeline of diagnoses/treatments/history
- [ ] Searchable / filterable

## Summary Export
- [ ] Doctor-friendly structured summary, scannable in 30s
- [ ] Printable view

## Care Team Management
- [ ] Invite family members to a care group
- [ ] Assign roles & permissions
- [ ] Member list management

## Notifications
- [ ] In-app notifications scoped per care group
- [ ] Alerts on new appointment, task assignment, new medical log entry
- [ ] Notify owner / email via notifyOwner helper where relevant

## Testing & Polish
- [ ] Vitest coverage for key procedures
- [ ] Responsive + accessibility review
- [ ] Final status check + checkpoint

# Kura: Unified Health Management

## Brand Name
**Kura**

*   **Pronunciation:** /ˈkʉːrɑ/ (similar to 
koo-rah)
*   **Meaning:** Invented, easy to pronounce, and not found in dictionaries, fulfilling the user's request for a unique name.

## Concept Overview
Kura is a comprehensive web application designed to streamline health management for two primary user groups: adult children coordinating care for aging or ill parents, and patients managing complex or chronic conditions. It integrates logistical coordination with a personal medical timeline, aiming to centralize scattered health information and improve communication among caregivers and healthcare providers.

## Target Audience
1.  **Adult children with aging or ill parents:** These users need to coordinate care with various healthcare professionals (home care, doctors, physiotherapists, pharmacies) and family members. The current process is often disorganized, relying on verbal communication or fragmented chat messages.
2.  **Patients with complex or chronic conditions:** These users struggle with fragmented medical records spread across different healthcare providers. They frequently have to recount their medical history, leading to inefficiencies and potential inaccuracies.

## Problem Statement
*   **For Caregivers:** Lack of a centralized system for coordinating appointments, medical status updates, authorizations, and task assignments among family members and professional caregivers. This leads to forgotten information, miscommunication, and increased stress.
*   **For Patients:** Difficulty in maintaining a coherent and accessible medical history. Information is siloed, forcing patients to act as the primary, often unreliable, conduit of their own health data to new healthcare providers.

## Solution: Kura - Unified Health Management
Kura addresses these problems by offering a dual-function platform:

### 1. Caregiver Coordination Module (Inspired by "Omhu")
*   **Functionality:** A logistics and journaling system for families. It logs medical status, appointments, authorizations, and assigns tasks to specific individuals.
*   **Key Features:**
    *   **Shared Calendar:** For appointments with doctors, home care, physiotherapy, etc.
    *   **Medical Log:** Track medication, symptoms, vital signs, and general well-being.
    *   **Task Management:** Assign and track responsibilities among family members and caregivers.
    *   **Document Storage:** Securely store important documents like full powers of attorney, prescriptions, and medical reports.
    *   **Communication Hub:** Centralized messaging for the care team.
    *   **Integration/Export:** Ability to generate structured summaries for public healthcare services when needed.

### 2. Medical Timeline Module (Inspired by "Epikrise")
*   **Functionality:** A privacy-encrypted program that combines the patient's self-logged data (symptoms, medication, side effects) with public journal data into a visual, searchable timeline.
*   **Key Features:**
    *   **Personal Health Log:** Patients can log symptoms, medication intake, side effects, and personal observations.
    *   **Data Integration:** Securely import relevant data from public health records (e.g., national health portals, GP records).
    *   **Visual Timeline:** A clear, chronological overview of medical history, diagnoses, treatments, and key events.
    *   **Searchable Database:** Quickly find specific information within the medical history.
    *   **Doctor-Friendly Summary:** Designed for quick review by healthcare professionals (e.g., readable in 30 seconds).
    *   **Privacy and Security:** End-to-end encryption and strict access controls.

## Content Architecture (High-Level)

*   **Homepage:** Introduction to Kura, its benefits, and target audiences. Call to action for registration/login.
*   **Dashboard (User-specific):** Overview of active care plans, upcoming appointments, recent medical log entries, and notifications.
*   **Caregiver Module Sections:**
    *   **Family/Care Team:** Manage members, roles, and permissions.
    *   **Calendar:** View and manage all appointments.
    *   **Medical Log:** Detailed logging and history.
    *   **Tasks:** Assign and track tasks.
    *   **Documents:** Secure document storage.
    *   **Communication:** Internal messaging.
*   **Medical Timeline Module Sections:**
    *   **My Health Log:** Personal symptom and medication tracking.
    *   **Medical Records:** Integrated public health data.
    *   **Timeline View:** Interactive visual timeline.
    *   **Reports/Export:** Generate summaries for doctors.
*   **Settings/Profile:** User preferences, privacy settings, data management.
*   **Help/FAQ:** Support resources.

This architecture provides a foundation for developing a robust and user-friendly platform that addresses the identified needs of both caregivers and patients.

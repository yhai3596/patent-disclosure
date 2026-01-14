---
name: patent-disclosure-assistant
description: This skill should be used when users need assistance in writing patent technical disclosure documents. It guides users through the process of transforming technical descriptions into standardized disclosure documents following established guidelines, including understanding specifications, collecting background information, generating drafts, reviewing, and producing final versions.
---

# Patent Disclosure Assistant

## Overview

This skill assists in the creation of patent technical disclosure documents. It provides a structured workflow for transforming initial technical descriptions into standardized disclosure documents that meet formal requirements. The skill guides users through understanding specifications, collecting necessary background information, generating draft documents, conducting reviews, and producing final versions.

## Core Functions

### 1. Specification Understanding
- Analyze and understand technical disclosure writing guidelines and sample documents
- Extract key requirements and formatting standards
- Formulate writing and review specifications

### 2. Information Collection
- Guide users to provide necessary background information about the patent/technology
- Prompt for missing or unclear information
- Validate completeness of provided information

### 3. Draft Generation
- Generate initial technical disclosure draft based on collected information
- Apply formatting and structural requirements from specifications
- Ensure technical accuracy and completeness

### 4. Document Review
- Review draft documents against established guidelines
- Identify areas requiring improvement or correction
- Provide specific review feedback and suggestions

### 5. Final Document Production
- Incorporate review feedback to produce final version
- Ensure compliance with all specifications
- Generate properly formatted final document

### 6. Document Management
- Save final documents to local storage
- Maintain organization of generated documents

## Workflow

### Step 1: Understand Specifications
1. Read and analyze the technical disclosure writing guidelines
2. Study sample disclosure documents to understand structure and requirements
3. Formulate comprehensive writing and review specifications

### Step 2: Collect Background Information
1. Guide user to provide initial technical description
2. Prompt for additional information including:
   - Technical field and background
   - Technical problems addressed
   - Technical solutions and innovations
   - Technical effects and advantages
   - Implementation examples
   - Drawings and figures (if applicable)
3. Validate completeness and clarity of information

### Step 3: Generate Initial Draft
1. Structure document according to specification requirements
2. Incorporate user-provided technical information
3. Apply proper formatting and terminology
4. Generate complete draft document

### Step 4: Review Draft
1. Compare draft against writing guidelines
2. Check for compliance with structure and formatting requirements
3. Verify technical accuracy and completeness
4. Generate review comments and suggestions

### Step 5: Produce Final Document
1. Incorporate review feedback into draft
2. Make necessary corrections and improvements
3. Generate polished final document
4. Confirm compliance with all specifications

### Step 6: Save and Confirm
1. Present final document to user for confirmation
2. Save confirmed document to local storage
3. Provide download options and organization suggestions

## Resource Usage Guide

### scripts/ Directory
Contains executable Python scripts for document processing:
- `analyze_specifications.py`: Analyze writing guidelines and samples to extract requirements
- `collect_information.py`: Guide information collection and validate completeness
- `generate_draft.py`: Generate initial disclosure draft
- `review_document.py`: Review draft against specifications
- `save_document.py`: Save final document to local storage

### references/ Directory
Contains reference documentation:
- `writing_guidelines.md`: Technical disclosure writing guidelines (to be provided by user)
- `sample_disclosure.md`: Sample disclosure document (to be provided by user)
- `specification_summary.md`: Extracted writing and review specifications

### assets/ Directory
Contains template files:
- `disclosure_template.md`: Template for technical disclosure documents
- `review_checklist.md`: Checklist for document review

## Usage Examples

### Example 1: New Technology Disclosure
User request: "Help me write a technical disclosure for a new machine learning algorithm"

Skill should:
1. Guide user to provide algorithm details, innovation points, and technical effects
2. Generate structured disclosure draft following specifications
3. Review draft for compliance and completeness
4. Produce final document and save to local storage

### Example 2: Improvement Patent Disclosure
User request: "Create a disclosure document for an improvement to existing manufacturing equipment"

Skill should:
1. Collect information about existing equipment and specific improvements
2. Highlight technical problems solved and advantages gained
3. Generate draft with clear comparison to prior art
4. Ensure proper formatting and technical accuracy

## Important Considerations

1. **Technical Accuracy**: Ensure all technical information is accurate and properly described
2. **Specification Compliance**: Strictly follow writing guidelines and formatting requirements
3. **Information Completeness**: Verify all required information is collected before draft generation
4. **Confidentiality**: Handle sensitive technical information appropriately
5. **Document Quality**: Produce high-quality documents suitable for patent application

## Quality Checklist

- [ ] Writing guidelines and samples properly analyzed
- [ ] All necessary background information collected
- [ ] Draft follows required structure and formatting
- [ ] Technical information accurate and complete
- [ ] Review identifies all necessary improvements
- [ ] Final document complies with all specifications
- [ ] Document saved properly to local storage
import { EXTENDED_TEMPLATES } from './industry-templates-extended';

// Industry-Specific CRM Templates for JANAKI
// Deep, build-ready templates with automation triggers

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  entities: EntityDefinition[];
  pipelineStages: StageDefinition[];
  automationRules: AutomationRuleDefinition[];
  customFields: CustomFieldDefinition[];
}

export interface EntityDefinition {
  name: string;
  label: string;
  fields: string[];
}

export interface StageDefinition {
  name: string;
  order: number;
  color: string;
  probability: number;
  description: string;
  intent: string;
  requiredFields: string[];
  subStatuses: string[];
  failureSignals: string[];
  automations: StageAutomation[];
}

export interface StageAutomation {
  trigger: 'on_enter' | 'on_duration' | 'on_exit';
  duration?: number; // minutes
  actions: AutomationAction[];
}

export interface AutomationAction {
  type: 'create_task' | 'send_notification' | 'assign_user' | 'update_field' | 'send_email';
  config: Record<string, any>;
}

export interface AutomationRuleDefinition {
  name: string;
  description: string;
  trigger: string;
  actions: AutomationAction[];
}

export interface CustomFieldDefinition {
  name: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
}

// ==================== TEMPLATES ====================

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  education: {
    id: 'education',
    name: 'Education & Study Abroad',
    description: 'High-touch, long-cycle student counseling and admissions',
    icon: 'GraduationCap',
    entities: [
      {
        name: 'student',
        label: 'Student',
        fields: ['name', 'contact', 'email', 'desiredCountry', 'educationLevel', 'budget', 'intakePreference']
      },
      {
        name: 'parent',
        label: 'Parent/Sponsor',
        fields: ['name', 'relationship', 'contact', 'email']
      },
      {
        name: 'program',
        label: 'Program',
        fields: ['university', 'course', 'country', 'intake', 'tuitionFee', 'duration']
      },
    ],
    pipelineStages: [
      {
        name: 'Inquiry Received',
        order: 1,
        color: '#94a3b8',
        probability: 5,
        description: 'Student has shown initial interest',
        intent: 'Capture basic contact and interest information',
        requiredFields: ['name', 'contact', 'desiredCountry', 'educationLevel'],
        subStatuses: ['WhatsApp', 'Call', 'Form', 'Walk-in'],
        failureSignals: ['No contact for 24 hours', 'Incomplete information'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'assign_user',
                config: { role: 'counselor', strategy: 'round_robin' }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Schedule first counseling call',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: 'New inquiry assigned to you' }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 1440, // 24 hours
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'URGENT: Follow up on pending inquiry',
                  priority: 'urgent',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Initial Counseling Completed',
        order: 2,
        color: '#60a5fa',
        probability: 15,
        description: 'Eligibility and intent discussed with student',
        intent: 'Understand budget, timeline, and qualification',
        requiredFields: ['budget', 'englishTestStatus', 'academicScore', 'intakePreference'],
        subStatuses: ['Budget Clear', 'Budget Unclear', 'Intake Decided', 'Intake Flexible'],
        failureSignals: ['Budget mismatch', 'Unclear timeline', 'Low qualification'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Generate eligibility report and shortlist',
                  dueInHours: 48,
                  assignToOwner: true
                }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 4320, // 3 days
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up: Share university options',
                  priority: 'high',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Eligibility & Shortlisting',
        order: 3,
        color: '#8b5cf6',
        probability: 30,
        description: 'Universities and programs shortlisted',
        intent: 'Match student profile with suitable programs',
        requiredFields: ['shortlistedPrograms', 'preferredCountry'],
        subStatuses: ['Eligible', 'Borderline', 'Need Prep'],
        failureSignals: ['Weak profile', 'Unrealistic expectations', 'Budget issues'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Start document checklist preparation',
                  dueInHours: 24,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Document Collection',
        order: 4,
        color: '#f59e0b',
        probability: 45,
        description: 'Academic and financial documents being collected',
        intent: 'Gather all required application materials',
        requiredFields: ['documentChecklist'],
        subStatuses: ['In Progress', 'Pending Items', 'Complete'],
        failureSignals: ['Delay > 3 days', 'Missing critical docs', 'Document quality issues'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Daily reminder: Check document collection status',
                  dueInHours: 24,
                  assignToOwner: true,
                  recurring: true
                }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 4320, // 3 days
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'URGENT: Documents delayed - escalate to manager',
                  priority: 'urgent',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Application Submitted',
        order: 5,
        color: '#3b82f6',
        probability: 60,
        description: 'Applications sent to universities',
        intent: 'Track application submission and fees',
        requiredFields: ['applicationId', 'submissionDate'],
        subStatuses: ['Paid', 'Pending Fee', 'Fee Waived'],
        failureSignals: ['Payment delay', 'Application incomplete'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up on application status',
                  dueInHours: 336, // 14 days
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: 'Application submitted successfully!' }
              }
            ]
          }
        ]
      },
      {
        name: 'Offer Received',
        order: 6,
        color: '#10b981',
        probability: 75,
        description: 'University offer letter received',
        intent: 'Review and process offer conditions',
        requiredFields: ['offerType', 'offerDeadline'],
        subStatuses: ['Conditional', 'Unconditional'],
        failureSignals: ['Approaching deadline', 'Condition not met'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Review offer conditions and acceptance deadline',
                  priority: 'high',
                  dueInHours: 48,
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '🎉 Offer received! Review immediately.' }
              }
            ]
          }
        ]
      },
      {
        name: 'Offer Accepted',
        order: 7,
        color: '#22c55e',
        probability: 85,
        description: 'Student has accepted the offer',
        intent: 'Begin visa and payment process',
        requiredFields: ['acceptanceDate', 'tuitionDeadline'],
        subStatuses: ['Payment Pending', 'Payment Confirmed'],
        failureSignals: ['Payment delay', 'Visa prep not started'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Initiate tuition payment process',
                  priority: 'high',
                  dueInHours: 48,
                  assignToOwner: true
                }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Start visa documentation preparation',
                  dueInHours: 72,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Visa Filed',
        order: 8,
        color: '#6366f1',
        probability: 90,
        description: 'Visa application submitted',
        intent: 'Track visa processing and requirements',
        requiredFields: ['visaApplicationId', 'filingDate'],
        subStatuses: ['Biometrics Pending', 'Biometrics Done', 'Interview Scheduled'],
        failureSignals: ['Biometrics delay', 'Missing documents'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Track visa status - check embassy portal',
                  dueInHours: 168, // 7 days
                  assignToOwner: true,
                  recurring: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Visa Decision',
        order: 9,
        color: '#10b981',
        probability: 95,
        description: 'Visa approved or refused',
        intent: 'Record outcome and next steps',
        requiredFields: ['visaStatus', 'decisionDate'],
        subStatuses: ['Approved', 'Refused', 'Additional Docs Requested'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'send_notification',
                config: { message: 'Visa decision received - check immediately!' }
              }
            ]
          }
        ]
      },
      {
        name: 'Enrollment Completed',
        order: 10,
        color: '#059669',
        probability: 100,
        description: 'Student successfully enrolled',
        intent: 'Case closure and referral generation',
        requiredFields: ['enrollmentDate', 'studentId'],
        subStatuses: ['Enrolled', 'Deferred'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Request referral and testimonial',
                  dueInHours: 168,
                  assignToOwner: true
                }
              },
              {
                type: 'update_field',
                config: {
                  field: 'tags',
                  value: 'alumni'
                }
              }
            ]
          }
        ]
      }
    ],
    automationRules: [
      {
        name: 'Daily Follow-up Reminders',
        description: 'Create daily tasks for any deal not updated in 24 hours',
        trigger: 'time_based',
        actions: [
          {
            type: 'create_task',
            config: {
              title: 'Follow up with student - no activity in 24 hours',
              priority: 'high'
            }
          }
        ]
      }
    ],
    customFields: [
      { name: 'desiredCountry', label: 'Desired Country', type: 'select', options: ['USA', 'UK', 'Canada', 'Australia', 'Germany'], required: true },
      { name: 'educationLevel', label: 'Education Level', type: 'select', options: ['Undergraduate', 'Postgraduate', 'PhD'], required: true },
      { name: 'englishTestStatus', label: 'English Test', type: 'select', options: ['Not Taken', 'Scheduled', 'Completed'], required: false },
      { name: 'budget', label: 'Budget (USD)', type: 'number', required: true },
    ]
  },

  // ==================== AGENCY & SERVICE BUSINESS ====================
  agency: {
    id: 'agency',
    name: 'Agencies & Service Businesses',
    description: 'Project + Retainer based service delivery',
    icon: 'Briefcase',
    entities: [
      {
        name: 'client',
        label: 'Client',
        fields: ['name', 'company', 'contact', 'email', 'industry', 'companySize']
      },
      {
        name: 'servicePackage',
        label: 'Service Package',
        fields: ['name', 'description', 'deliverables', 'timeline', 'pricing']
      },
      {
        name: 'project',
        label: 'Project',
        fields: ['name', 'client', 'startDate', 'endDate', 'budget', 'status']
      },
    ],
    pipelineStages: [
      {
        name: 'Lead Captured',
        order: 1,
        color: '#94a3b8',
        probability: 10,
        description: 'Interest shown via any channel',
        intent: 'Initial contact established',
        requiredFields: ['name', 'contact', 'serviceInterest'],
        subStatuses: ['Website Form', 'Referral', 'Cold Outreach', 'Event'],
        failureSignals: ['No contact attempted within 4 hours'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'assign_user',
                config: { role: 'sales', strategy: 'round_robin' }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Call new lead within 4 hours',
                  priority: 'high',
                  dueInHours: 4,
                  assignToOwner: true
                }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 240, // 4 hours
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'URGENT: Lead not contacted yet!',
                  priority: 'urgent',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Discovery Call Done',
        order: 2,
        color: '#60a5fa',
        probability: 25,
        description: 'Requirements understood',
        intent: 'Qualify opportunity and understand scope',
        requiredFields: ['scope', 'budgetRange', 'decisionMaker', 'timeline'],
        subStatuses: ['Qualified', 'Needs Nurturing', 'Unqualified'],
        failureSignals: ['Unclear scope', 'Budget too low', 'No decision maker access'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Prepare and send proposal',
                  dueInHours: 48,
                  assignToOwner: true
                }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 2880, // 2 days
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up: Proposal status check',
                  priority: 'high',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Proposal Sent',
        order: 3,
        color: '#8b5cf6',
        probability: 40,
        description: 'Commercial and scope shared',
        intent: 'Waiting for client review and decision',
        requiredFields: ['proposalAmount', 'proposalDate'],
        subStatuses: ['Viewed', 'Negotiating', 'Silent'],
        failureSignals: ['No response > 5 days', 'Price objection', 'Competitor comparison'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up after 2 days',
                  dueInHours: 48,
                  assignToOwner: true
                }
              }
            ]
          },
          {
            trigger: 'on_duration',
            duration: 7200, // 5 days
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'URGENT: Proposal stuck for 5 days - escalate',
                  priority: 'urgent',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Proposal Accepted',
        order: 4,
        color: '#f59e0b',
        probability: 60,
        description: 'Verbal or email confirmation received',
        intent: 'Move to legal and payment',
        requiredFields: ['acceptanceDate', 'finalAmount'],
        subStatuses: ['Verbal Yes', 'Email Confirmed'],
        failureSignals: ['Payment terms not agreed'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Generate contract and send',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Generate and send invoice',
                  dueInHours: 24,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Contract Signed',
        order: 5,
        color: '#3b82f6',
        probability: 75,
        description: 'Legal agreement executed',
        intent: 'Formal commitment secured',
        requiredFields: ['contractDate', 'contractValue'],
        subStatuses: ['Signed', 'Pending Signatures'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'send_notification',
                config: { message: '🎉 Contract signed! Waiting for advance payment.' }
              }
            ]
          }
        ]
      },
      {
        name: 'Advance Payment Received',
        order: 6,
        color: '#10b981',
        probability: 85,
        description: 'Project kickoff approved',
        intent: 'Begin service delivery',
        requiredFields: ['paymentDate', 'amountReceived'],
        subStatuses: ['Full Payment', 'Partial Payment'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Create project and assign team',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Schedule kickoff meeting',
                  dueInHours: 48,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Service In Progress',
        order: 7,
        color: '#6366f1',
        probability: 90,
        description: 'Execution phase',
        intent: 'Deliver committed work',
        requiredFields: ['projectManager', 'expectedCompletionDate'],
        subStatuses: ['On Track', 'At Risk', 'Client Delay', 'Scope Creep'],
        failureSignals: ['Timeline delay', 'Scope changes', 'Client unresponsive'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Weekly client status update',
                  dueInHours: 168,
                  assignToOwner: true,
                  recurring: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Final Delivery',
        order: 8,
        color: '#22c55e',
        probability: 95,
        description: 'Work completed and delivered',
        intent: 'Client review and sign-off',
        requiredFields: ['deliveryDate'],
        subStatuses: ['Delivered', 'In Review', 'Revisions Requested'],
        failureSignals: ['Client not reviewing'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Get client feedback and testimonial',
                  dueInHours: 72,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Closure / Retainer Conversion',
        order: 9,
        color: '#059669',
        probability: 100,
        description: 'Project closed or converted to retainer',
        intent: 'Upsell and retention opportunity',
        requiredFields: ['closureType'],
        subStatuses: ['One-time Project', 'Retainer Converted', 'Upsold'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Discuss retainer or next project',
                  dueInHours: 168,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      }
    ],
    automationRules: [
      {
        name: 'Proposal Follow-up Automation',
        description: 'Auto follow-up on proposals not responded to',
        trigger: 'stage_duration',
        actions: [
          {
            type: 'create_task',
            config: { title: 'Follow up on proposal', priority: 'high' }
          }
        ]
      }
    ],
    customFields: [
      { name: 'serviceInterest', label: 'Service Interest', type: 'select', options: ['Web Development', 'App Development', 'Design', 'Marketing', 'Consulting'], required: true },
      { name: 'budgetRange', label: 'Budget Range', type: 'select', options: ['< $5K', '$5K-$10K', '$10K-$25K', '$25K-$50K', '> $50K'], required: true },
    ]
  },

  // Additional templates continue in next replacement
};

export function getIndustryTemplate(industryId: string): IndustryTemplate | null {
  return INDUSTRY_TEMPLATES[industryId] || EXTENDED_TEMPLATES[industryId] || null;
}

export function getAllIndustryTemplates(): IndustryTemplate[] {
  return [...Object.values(INDUSTRY_TEMPLATES), ...Object.values(EXTENDED_TEMPLATES)];
}

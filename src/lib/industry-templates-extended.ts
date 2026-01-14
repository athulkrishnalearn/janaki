// Extended Industry Templates - Recruitment & SME
// Part 2 of Industry Templates

import { IndustryTemplate } from './industry-templates';

export const EXTENDED_TEMPLATES: Record<string, IndustryTemplate> = {
  // ==================== RECRUITMENT & STAFFING ====================
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment & Staffing',
    description: 'Dual-sided candidate and client management',
    icon: 'Users',
    entities: [
      {
        name: 'candidate',
        label: 'Candidate',
        fields: ['name', 'contact', 'email', 'currentRole', 'experience', 'expectedSalary', 'noticePeriod']
      },
      {
        name: 'clientCompany',
        label: 'Client Company',
        fields: ['name', 'industry', 'contact', 'hiringManager']
      },
      {
        name: 'jobRequirement',
        label: 'Job Requirement',
        fields: ['title', 'client', 'budget', 'urgency', 'jobDescription']
      },
    ],
    pipelineStages: [
      // CANDIDATE PIPELINE
      {
        name: 'Candidate Sourced',
        order: 1,
        color: '#94a3b8',
        probability: 5,
        description: 'Resume/profile added to system',
        intent: 'Initial candidate discovery',
        requiredFields: ['name', 'contact', 'resume'],
        subStatuses: ['LinkedIn', 'Portal', 'Referral', 'Database'],
        failureSignals: ['Incomplete profile', 'No contact info'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'assign_user',
                config: { role: 'recruiter', strategy: 'by_specialization' }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Screen candidate resume',
                  priority: 'medium',
                  dueInHours: 24,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Screening Completed',
        order: 2,
        color: '#60a5fa',
        probability: 15,
        description: 'Initial screening done',
        intent: 'Determine fit for open positions',
        requiredFields: ['screeningNotes', 'fitStatus'],
        subStatuses: ['Strong Fit', 'Moderate Fit', 'Poor Fit', 'Future Consideration'],
        failureSignals: ['Salary mismatch', 'Skills gap', 'Attitude issues'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Match candidate to open requirements',
                  dueInHours: 12,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Shortlisted for Client',
        order: 3,
        color: '#8b5cf6',
        probability: 30,
        description: 'Matched to specific job requirement',
        intent: 'Prepare for client presentation',
        requiredFields: ['jobRequirement', 'matchScore'],
        subStatuses: ['Preparing Profile', 'Ready to Share'],
        failureSignals: ['Candidate unavailable', 'Better candidates found'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Share candidate profile with client',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Interview Scheduled',
        order: 4,
        color: '#f59e0b',
        probability: 45,
        description: 'Client interview arranged',
        intent: 'Facilitate interview process',
        requiredFields: ['interviewDate', 'interviewMode', 'interviewRound'],
        subStatuses: ['Round 1', 'Round 2', 'Final Round'],
        failureSignals: ['Candidate dropout', 'Interview postponed'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Send interview details and prep to candidate',
                  priority: 'high',
                  dueInHours: 12,
                  assignToOwner: true
                }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Follow up post-interview for feedback',
                  dueInHours: 48,
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: 'Interview scheduled - prepare candidate' }
              }
            ]
          }
        ]
      },
      {
        name: 'Interview Cleared',
        order: 5,
        color: '#10b981',
        probability: 60,
        description: 'Positive feedback from client',
        intent: 'Move towards offer',
        requiredFields: ['clientFeedback'],
        subStatuses: ['Strong Positive', 'Conditional', 'Waiting Decision'],
        failureSignals: ['Salary negotiation stuck', 'Candidate backing out'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Negotiate salary and terms',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Offer Rolled Out',
        order: 6,
        color: '#3b82f6',
        probability: 75,
        description: 'Formal offer letter sent',
        intent: 'Close the placement',
        requiredFields: ['offerCTC', 'offerDate', 'joiningDate'],
        subStatuses: ['Offer Sent', 'Negotiating', 'Offer Accepted', 'Offer Declined'],
        failureSignals: ['Counter offer', 'Delay in acceptance', 'Family concerns'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up on offer acceptance daily',
                  priority: 'urgent',
                  dueInHours: 24,
                  assignToOwner: true,
                  recurring: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '\ud83c\udf89 Offer rolled out - track acceptance!' }
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
                  title: 'URGENT: Offer pending for 3 days - escalate',
                  priority: 'urgent',
                  assignToOwner: true
                }
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
        description: 'Candidate confirmed joining',
        intent: 'Ensure smooth onboarding',
        requiredFields: ['acceptanceDate', 'joiningDate'],
        subStatuses: ['Serving Notice', 'Free to Join', 'Background Check'],
        failureSignals: ['Notice period extension', 'Counter offer received'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Weekly check-in until joining date',
                  dueInHours: 168,
                  assignToOwner: true,
                  recurring: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '\u2705 Offer accepted! Monitor until joining.' }
              }
            ]
          }
        ]
      },
      {
        name: 'Joined',
        order: 8,
        color: '#059669',
        probability: 95,
        description: 'Candidate successfully joined',
        intent: 'Placement successful',
        requiredFields: ['actualJoiningDate'],
        subStatuses: ['Joined', 'On Probation'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Invoice client for recruitment fee',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              },
              {
                type: 'create_task',
                config: {
                  title: 'Post-joining follow-up (30 days)',
                  dueInHours: 720,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Dropout / No-show',
        order: 9,
        color: '#ef4444',
        probability: 0,
        description: 'Candidate did not join or left early',
        intent: 'Track failure reasons',
        requiredFields: ['dropoutReason', 'dropoutStage'],
        subStatuses: ['No Show', 'Resigned Early', 'Counter Offer', 'Personal Reasons'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Document learnings and find replacement',
                  priority: 'high',
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '\u26a0\ufe0f Dropout recorded - analyze reason' }
              }
            ]
          }
        ]
      }
    ],
    automationRules: [
      {
        name: 'Dropout Prediction',
        description: 'Alert if candidate shows dropout signals',
        trigger: 'field_change',
        actions: [
          {
            type: 'send_notification',
            config: { message: 'Candidate may dropout - take action' }
          }
        ]
      },
      {
        name: 'Daily Candidate Status Check',
        description: 'Check all active candidates daily',
        trigger: 'time_based',
        actions: [
          {
            type: 'create_task',
            config: { title: 'Review active candidates', priority: 'medium' }
          }
        ]
      }
    ],
    customFields: [
      { name: 'noticePeriod', label: 'Notice Period', type: 'select', options: ['Immediate', '15 days', '30 days', '60 days', '90 days'], required: true },
      { name: 'expectedSalary', label: 'Expected Salary', type: 'number', required: true },
      { name: 'currentRole', label: 'Current Role', type: 'text', required: true },
    ]
  },

  // ==================== SME / FOUNDER-LED SALES ====================
  sme: {
    id: 'sme',
    name: 'SME / Founder-Led Sales',
    description: 'Minimal, human, founder-friendly pipeline',
    icon: 'Rocket',
    entities: [
      {
        name: 'lead',
        label: 'Lead',
        fields: ['name', 'contact', 'source']
      },
      {
        name: 'interaction',
        label: 'Interaction',
        fields: ['date', 'type', 'notes', 'nextAction']
      },
    ],
    pipelineStages: [
      {
        name: 'Someone Interested',
        order: 1,
        color: '#94a3b8',
        probability: 10,
        description: 'Name + phone exists',
        intent: 'Just captured basic info',
        requiredFields: ['name', 'contact'],
        subStatuses: [],
        failureSignals: ['No response in 48 hours'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Reach out to new lead',
                  priority: 'high',
                  dueInHours: 24,
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
                  title: 'REMINDER: Follow up with lead',
                  priority: 'high',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Talked Once',
        order: 2,
        color: '#60a5fa',
        probability: 25,
        description: 'First real conversation happened',
        intent: 'Built initial rapport',
        requiredFields: ['firstCallNotes'],
        subStatuses: [],
        failureSignals: ['Vague interest', 'Cannot reach again'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Schedule follow-up call',
                  dueInHours: 72,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Understood Need',
        order: 3,
        color: '#8b5cf6',
        probability: 40,
        description: 'Problem + budget roughly known',
        intent: 'Qualified the opportunity',
        requiredFields: ['problem', 'budget'],
        subStatuses: [],
        failureSignals: ['Budget too low', 'Not urgent'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Prepare solution/quote',
                  dueInHours: 48,
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Offered Solution',
        order: 4,
        color: '#f59e0b',
        probability: 55,
        description: 'Price / proposal discussed',
        intent: 'Ball is in their court',
        requiredFields: ['quotedPrice', 'proposalDate'],
        subStatuses: [],
        failureSignals: ['Price shock', 'Comparing alternatives'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Follow up on proposal',
                  dueInHours: 72,
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
                  title: 'Check if still interested',
                  priority: 'medium',
                  assignToOwner: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Thinking',
        order: 5,
        color: '#3b82f6',
        probability: 65,
        description: 'No decision yet, considering',
        intent: 'Keep warm, nurture',
        requiredFields: ['thinkingReason'],
        subStatuses: ['Budget Approval', 'Timing Issues', 'Comparing Options', 'Internal Discussion'],
        failureSignals: ['Going silent', 'Delaying indefinitely'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Check-in: Any updates?',
                  dueInHours: 168, // 1 week
                  assignToOwner: true,
                  recurring: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Yes (Verbal)',
        order: 6,
        color: '#10b981',
        probability: 80,
        description: 'Agreed in principle',
        intent: 'Close the paperwork',
        requiredFields: ['verbalYesDate'],
        subStatuses: [],
        failureSignals: ['Taking too long to commit'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Send invoice/agreement',
                  priority: 'high',
                  dueInHours: 12,
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '\ud83c\udf89 Verbal yes! Get payment ASAP' }
              }
            ]
          }
        ]
      },
      {
        name: 'Payment Pending',
        order: 7,
        color: '#f59e0b',
        probability: 85,
        description: 'Invoice sent, awaiting payment',
        intent: 'Money in the bank',
        requiredFields: ['invoiceNumber', 'invoiceDate'],
        subStatuses: [],
        failureSignals: ['Payment delay', 'Asking for discounts'],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Daily payment reminder',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true,
                  recurring: true
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Closed - Won',
        order: 8,
        color: '#059669',
        probability: 100,
        description: 'Money received',
        intent: 'Success! Deliver and delight',
        requiredFields: ['paymentDate', 'amountReceived'],
        subStatuses: [],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Start delivery/onboarding',
                  priority: 'high',
                  dueInHours: 24,
                  assignToOwner: true
                }
              },
              {
                type: 'send_notification',
                config: { message: '\ud83d\ude80 Payment received! Start work!' }
              }
            ]
          }
        ]
      },
      {
        name: 'Closed - Lost',
        order: 9,
        color: '#ef4444',
        probability: 0,
        description: 'Not happening',
        intent: 'Learn and move on',
        requiredFields: ['lostReason'],
        subStatuses: ['Price Too High', 'Went with Competitor', 'Not Right Time', 'Not Interested'],
        failureSignals: [],
        automations: [
          {
            trigger: 'on_enter',
            actions: [
              {
                type: 'create_task',
                config: {
                  title: 'Document learnings',
                  dueInHours: 24,
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
        name: 'Daily Pipeline Review',
        description: 'Remind founder to review all deals daily',
        trigger: 'time_based',
        actions: [
          {
            type: 'create_task',
            config: { title: 'Review all open deals', priority: 'medium' }
          }
        ]
      },
      {
        name: 'Silence Alert',
        description: 'Alert if no activity on deal for 3 days',
        trigger: 'stage_duration',
        actions: [
          {
            type: 'create_task',
            config: { title: 'Deal is silent - reach out', priority: 'high' }
          }
        ]
      }
    ],
    customFields: [
      { name: 'source', label: 'How did they find you?', type: 'select', options: ['Referral', 'Website', 'Social Media', 'Event', 'Other'], required: true },
      { name: 'urgency', label: 'How urgent?', type: 'select', options: ['ASAP', 'This month', 'Next quarter', 'Just exploring'], required: false },
    ]
  },
};

export function getExtendedTemplate(industryId: string): IndustryTemplate | null {
  return EXTENDED_TEMPLATES[industryId] || null;
}

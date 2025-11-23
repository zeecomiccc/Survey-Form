import { Survey } from '@/types/survey';
import { v4 as uuidv4 } from 'uuid';

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
}

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Collect feedback from your customers',
    icon: '💬',
    survey: {
      title: 'Customer Feedback Survey',
      description: 'We value your opinion! Please take a few minutes to share your feedback.',
      questions: [
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with our service?',
          description: 'Rate your overall satisfaction',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'single-choice',
          title: 'How did you hear about us?',
          description: 'Select one option',
          required: true,
          order: 1,
          options: [
            { id: uuidv4(), label: 'Social Media' },
            { id: uuidv4(), label: 'Friend/Family' },
            { id: uuidv4(), label: 'Advertisement' },
            { id: uuidv4(), label: 'Search Engine' },
            { id: uuidv4(), label: 'Other' },
          ],
        },
        {
          id: uuidv4(),
          type: 'textarea',
          title: 'What can we improve?',
          description: 'Share your suggestions',
          required: false,
          order: 2,
        },
        {
          id: uuidv4(),
          type: 'yes-no',
          title: 'Would you recommend us to others?',
          description: '',
          required: true,
          order: 3,
        },
      ],
    },
  },
  {
    id: 'nps',
    name: 'Net Promoter Score (NPS)',
    description: 'Measure customer loyalty with NPS',
    icon: '⭐',
    survey: {
      title: 'Net Promoter Score Survey',
      description: 'How likely are you to recommend us to a friend or colleague?',
      questions: [
        {
          id: uuidv4(),
          type: 'rating',
          title: 'On a scale of 0-10, how likely are you to recommend us?',
          description: '0 = Not at all likely, 10 = Extremely likely',
          required: true,
          minRating: 0,
          maxRating: 10,
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'textarea',
          title: 'What is the primary reason for your score?',
          description: 'Please share your thoughts',
          required: false,
          order: 1,
        },
      ],
    },
  },
  {
    id: 'event-feedback',
    name: 'Event Feedback',
    description: 'Collect feedback after an event',
    icon: '🎉',
    survey: {
      title: 'Event Feedback Survey',
      description: 'Help us improve our future events by sharing your experience',
      questions: [
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How would you rate the overall event?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: 'What did you enjoy most? (Select all that apply)',
          description: '',
          required: false,
          order: 1,
          options: [
            { id: uuidv4(), label: 'Content/Speakers' },
            { id: uuidv4(), label: 'Networking Opportunities' },
            { id: uuidv4(), label: 'Venue/Location' },
            { id: uuidv4(), label: 'Food & Beverages' },
            { id: uuidv4(), label: 'Organization' },
          ],
        },
        {
          id: uuidv4(),
          type: 'textarea',
          title: 'Any additional comments or suggestions?',
          description: '',
          required: false,
          order: 2,
        },
        {
          id: uuidv4(),
          type: 'yes-no',
          title: 'Would you attend a similar event in the future?',
          description: '',
          required: true,
          order: 3,
        },
      ],
    },
  },
  {
    id: 'product-satisfaction',
    name: 'Product Satisfaction',
    description: 'Gauge satisfaction with a product',
    icon: '📦',
    survey: {
      title: 'Product Satisfaction Survey',
      description: 'Tell us about your experience with our product',
      questions: [
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with the product quality?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with the product price?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 1,
        },
        {
          id: uuidv4(),
          type: 'single-choice',
          title: 'Which feature is most valuable to you?',
          description: '',
          required: true,
          order: 2,
          options: [
            { id: uuidv4(), label: 'Quality' },
            { id: uuidv4(), label: 'Price' },
            { id: uuidv4(), label: 'Design' },
            { id: uuidv4(), label: 'Functionality' },
            { id: uuidv4(), label: 'Support' },
          ],
        },
        {
          id: uuidv4(),
          type: 'textarea',
          title: 'What would you like to see improved?',
          description: '',
          required: false,
          order: 3,
        },
      ],
    },
  },
  {
    id: 'employee-satisfaction',
    name: 'Employee Satisfaction',
    description: 'Measure employee satisfaction and engagement',
    icon: '👥',
    survey: {
      title: 'Employee Satisfaction Survey',
      description: 'Your feedback helps us create a better workplace',
      questions: [
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with your job?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 0,
        },
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with work-life balance?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 1,
        },
        {
          id: uuidv4(),
          type: 'rating',
          title: 'How satisfied are you with your manager?',
          description: '',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 2,
        },
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: 'What do you value most at work? (Select all that apply)',
          description: '',
          required: false,
          order: 3,
          options: [
            { id: uuidv4(), label: 'Career Growth' },
            { id: uuidv4(), label: 'Work-Life Balance' },
            { id: uuidv4(), label: 'Compensation' },
            { id: uuidv4(), label: 'Team Culture' },
            { id: uuidv4(), label: 'Job Security' },
          ],
        },
        {
          id: uuidv4(),
          type: 'textarea',
          title: 'Any additional feedback?',
          description: '',
          required: false,
          order: 4,
        },
      ],
    },
  },
  {
    id: 'clear-aligner-oem',
    name: 'Clear Aligner OEM',
    description: 'Pick & Choose — Full Sequence From Treatment Planning to Manufacturing',
    icon: '🦷',
    survey: {
      title: 'Clear Aligner OEM / Manufacturing Options',
      description: 'Pick & Choose — Full Sequence From Treatment Planning to Manufacturing',
      questions: [
        // Treatment Planning Options
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '1. Treatment Planning Options',
          description: 'Select all applicable options (Pick & Choose)',
          required: false,
          order: 0,
          options: [
            { id: uuidv4(), label: 'Standard treatment setup using our protocols (IPR + attachments)' },
            { id: uuidv4(), label: 'Doctor-guided setup (you provide preferred IPR & attachment strategy)' },
            { id: uuidv4(), label: 'Zero-attachment protocol' },
            { id: uuidv4(), label: "Your brand's custom biomechanics rules (if provided)" },
            { id: uuidv4(), label: 'Fully doctor-controlled workflow (you upload final STL stages)' },
            { id: uuidv4(), label: 'Hybrid model — our planners + your clinician approval' },
          ],
        },
        // SLA Options
        {
          id: uuidv4(),
          type: 'single-choice',
          title: '2. SLA Options (Treatment Setup)',
          description: 'Select one option',
          required: false,
          order: 1,
          options: [
            { id: uuidv4(), label: 'Standard (48–72 hours)' },
            { id: uuidv4(), label: 'Priority (24 hours)' },
            { id: uuidv4(), label: 'Express (same-day)' },
          ],
        },
        // IPR & Attachment Preferences
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '3. IPR & Attachment Preferences',
          description: 'Select all applicable options',
          required: false,
          order: 2,
          options: [
            { id: uuidv4(), label: 'Default ClearPath IPR sequence' },
            { id: uuidv4(), label: 'Custom IPR charts based on your brand' },
            { id: uuidv4(), label: 'No-IPR protocol' },
          ],
        },
        // Attachment Types
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '4. Attachment Types',
          description: 'Select all applicable options',
          required: false,
          order: 3,
          options: [
            { id: uuidv4(), label: 'Standard composite attachments' },
            { id: uuidv4(), label: 'Optimized/engager-style shapes' },
            { id: uuidv4(), label: '3D-printed templates with precision cuts' },
          ],
        },
        // Undercut & Model Preparation
        {
          id: uuidv4(),
          type: 'single-choice',
          title: '5. Undercut & Model Preparation',
          description: 'Select one option',
          required: false,
          order: 4,
          options: [
            { id: uuidv4(), label: 'Digital undercut blocking' },
            { id: uuidv4(), label: 'Manual blocking' },
            { id: uuidv4(), label: 'Hybrid (digital + manual QC)' },
          ],
        },
        // Trimline Style
        {
          id: uuidv4(),
          type: 'single-choice',
          title: '6. Trimline Style',
          description: 'Select one option',
          required: false,
          order: 5,
          options: [
            { id: uuidv4(), label: 'Scalloped' },
            { id: uuidv4(), label: 'Straight (0.5 mm above gingiva)' },
            { id: uuidv4(), label: 'Straight & polished' },
            { id: uuidv4(), label: 'High-retention profile' },
          ],
        },
        // Material Options
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '7. Material Options',
          description: 'Select all applicable options',
          required: false,
          order: 6,
          options: [
            { id: uuidv4(), label: 'Monolayer materials: PETG, TPU, co-polyester' },
            { id: uuidv4(), label: 'Premium triple-layer (hard–soft–hard)' },
            { id: uuidv4(), label: 'Branded sheets (if customer specifies a material vendor)' },
            { id: uuidv4(), label: 'Thickness options: 0.5 mm, 0.625 mm, 0.75 mm, 1.0 mm' },
            { id: uuidv4(), label: 'Progressive thickness protocol (thin → thick)' },
          ],
        },
        // Staging & Wear Protocol
        {
          id: uuidv4(),
          type: 'single-choice',
          title: '8. Staging & Wear Protocol',
          description: 'Select one option',
          required: false,
          order: 7,
          options: [
            { id: uuidv4(), label: '7-day wear' },
            { id: uuidv4(), label: '10-day wear' },
            { id: uuidv4(), label: 'Custom wear cycle based on brand/market preference' },
            { id: uuidv4(), label: 'Movement-per-stage customization (small → aggressive)' },
          ],
        },
        // Manufacturing Method
        {
          id: uuidv4(),
          type: 'single-choice',
          title: '9. Manufacturing Method',
          description: 'Select one option',
          required: false,
          order: 8,
          options: [
            { id: uuidv4(), label: 'Hand-trimmed aligners — precision by expert technicians' },
            { id: uuidv4(), label: 'CNC automated trimming — consistent edge uniformity' },
            { id: uuidv4(), label: 'Optional manual QC on every unit' },
          ],
        },
        // Laser Marking
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '10. Laser Marking',
          description: 'Select all applicable options',
          required: false,
          order: 9,
          options: [
            { id: uuidv4(), label: 'Case number + step number' },
            { id: uuidv4(), label: 'Add brand logo (optional)' },
            { id: uuidv4(), label: 'Add QR code linking to your app/patient portal' },
          ],
        },
        // Packaging
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '11. Packaging',
          description: 'Select all applicable options',
          required: false,
          order: 10,
          options: [
            { id: uuidv4(), label: 'Branded or plain aligner pouches' },
            { id: uuidv4(), label: 'Name, case number, step labeling' },
            { id: uuidv4(), label: 'Optional QR code on pouch' },
            { id: uuidv4(), label: 'Matte, gloss or recycled material pouches' },
          ],
        },
        // Boxing
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '12. Boxing',
          description: 'Select all applicable options',
          required: false,
          order: 11,
          options: [
            { id: uuidv4(), label: 'Bulk shipment in master cartons' },
            { id: uuidv4(), label: 'Individually boxed cases with your branding' },
            { id: uuidv4(), label: 'Premium patient starter box with: instructions, branded aligner case, chewies, removal tool' },
          ],
        },
        // Accessories
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '13. Accessories',
          description: 'Select all applicable options',
          required: false,
          order: 12,
          options: [
            { id: uuidv4(), label: 'Aligner chewies' },
            { id: uuidv4(), label: 'Aligner removal tools' },
            { id: uuidv4(), label: 'Dental wax' },
            { id: uuidv4(), label: 'Whitening syringes (if you want whitening add-on)' },
            { id: uuidv4(), label: 'Branded aligner cases' },
            { id: uuidv4(), label: 'Patient starter kits' },
          ],
        },
        // Compliance Enhancements
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '14. Compliance Enhancements',
          description: 'Select all applicable options',
          required: false,
          order: 13,
          options: [
            { id: uuidv4(), label: 'Wear indicators (optional)' },
            { id: uuidv4(), label: 'Patient progress tracking (if you have your own app)' },
            { id: uuidv4(), label: 'Batch-wise clinical reporting' },
          ],
        },
        // Digital Branding
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '15. Digital Branding',
          description: 'Select all applicable options',
          required: false,
          order: 14,
          options: [
            { id: uuidv4(), label: 'Use our treatment plan viewer with your logo' },
            { id: uuidv4(), label: 'Branding on the doctor portal (if preferred)' },
            { id: uuidv4(), label: 'Your logo on PDF treatment plans' },
            { id: uuidv4(), label: 'Your branding on all patient communication (if required)' },
          ],
        },
        // Delivery & Logistics
        {
          id: uuidv4(),
          type: 'multiple-choice',
          title: '16. Delivery & Logistics',
          description: 'Select all applicable options',
          required: false,
          order: 15,
          options: [
            { id: uuidv4(), label: 'Ship from Pakistan or UAE facility' },
            { id: uuidv4(), label: 'Bulk or batch shipments' },
            { id: uuidv4(), label: 'Blind shipping directly to clinics or patients' },
            { id: uuidv4(), label: 'Customer-arranged courier OR our freight-forwarding' },
            { id: uuidv4(), label: 'Warehouse storage (for large-volume clients)' },
          ],
        },
        // Dedicated Support
        {
          id: uuidv4(),
          type: 'yes-no',
          title: '17. Dedicated Support',
          description: 'A full-time account manager assigned only to your brand with priority communication channel (WhatsApp/Slack/Email), weekly or monthly operational review, and training for your doctors/CS reps (if needed)',
          required: false,
          order: 16,
        },
      ],
    },
  },
];


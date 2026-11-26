import * as Yup from 'yup';
import type { EventStatus } from '../types/event.types.ts';

export interface CreateEventFormValues {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  price: number;
  maxTicketsPerUser: number;
  status: EventStatus;
}

export type EventFormValues = CreateEventFormValues;

export const EVENT_STATUS_OPTIONS: { label: string; value: EventStatus }[] = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const eventValidationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .required('Event title is required'),
  description: Yup.string()
    .trim()
    .required('Description is required'),
  categoryId: Yup.string()
    .trim()
    .required('Category is required'),
  location: Yup.string()
    .trim()
    .required('Location is required'),
  startDate: Yup.string()
    .required('Start date is required')
    .test('valid-start-date', 'Start date must be a valid date', (val) => {
      if (!val) return false;
      return !isNaN(Date.parse(val));
    }),
  endDate: Yup.string()
    .required('End date is required')
    .test('valid-end-date', 'End date must be a valid date', (val) => {
      if (!val) return false;
      return !isNaN(Date.parse(val));
    })
    .test(
      'end-after-start',
      'End date must be later than start date',
      function (endDate) {
        const { startDate } = this.parent;
        if (!startDate || !endDate) return true;
        const start = Date.parse(startDate);
        const end = Date.parse(endDate);
        if (isNaN(start) || isNaN(end)) return true;
        return end > start;
      },
    ),
  capacity: Yup.number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || originalValue === undefined
        ? undefined
        : Number(value),
    )
    .positive('Capacity must be a positive integer')
    .integer('Capacity must be an integer')
    .optional(),
  price: Yup.number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || originalValue === undefined
        ? 0
        : Number(value),
    )
    .min(0, 'Ticket price must be 0 or greater')
    .test(
      'max-two-decimals',
      'Ticket price can have at most two decimal places',
      (value) =>
        value === undefined || /^\d+(\.\d{1,2})?$/.test(String(value)),
    )
    .required('Ticket price is required'),
  maxTicketsPerUser: Yup.number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || originalValue === undefined
        ? 5
        : Number(value),
    )
    .integer('Maximum tickets per user must be an integer')
    .min(1, 'Maximum tickets per user must be at least 1')
    .required('Maximum tickets per user is required'),
  status: Yup.string<EventStatus>()
    .oneOf(
      ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      'Status must be DRAFT, PUBLISHED, CANCELLED, or COMPLETED',
    )
    .required('Status is required'),
});

export const createEventValidationSchema = eventValidationSchema;

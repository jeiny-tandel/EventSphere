import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  createEvent as apiCreateEvent,
  createEventCategory as apiCreateEventCategory,
  deleteEvent as apiDeleteEvent,
  deleteEventCategory as apiDeleteEventCategory,
  deleteEventCoverImage as apiDeleteEventCoverImage,
  getEventById as apiGetEventById,
  getEventCategories as apiGetEventCategories,
  getEvents as apiGetEvents,
  getManagementEvents as apiGetManagementEvents,
  updateEvent as apiUpdateEvent,
  updateEventCategory as apiUpdateEventCategory,
  uploadEventCoverImage as apiUploadEventCoverImage,
} from '../../api/events.api.ts';
import type {
  CreateEventCategoryPayload,
  CreateEventPayload,
  Event,
  EventCategory,
  UpdateEventCategoryPayload,
  UpdateEventPayload,
} from '../../types/event.types.ts';
import { extractErrorMessage } from '../../utils';
import { authSlice } from './authSlice.ts';

const { logout } = authSlice.actions;

export interface EventState {
  events: Event[];
  managementEvents: Event[];
  categories: EventCategory[];
  selectedEvent: Event | null;
  isLoading: boolean;
  isLoaded: boolean;
  isManagementLoading: boolean;
  isManagementLoaded: boolean;
  isCategoriesLoading: boolean;
  areCategoriesLoaded: boolean;
  isSubmitting: boolean;
  error: string | null;
  currentRequestId: string | null;
}

const initialState: EventState = {
  events: [],
  managementEvents: [],
  categories: [],
  selectedEvent: null,
  isLoading: false,
  isLoaded: false,
  isManagementLoading: false,
  isManagementLoaded: false,
  isCategoriesLoading: false,
  areCategoriesLoaded: false,
  isSubmitting: false,
  error: null,
  currentRequestId: null,
};

// Async Thunks - Events
export const fetchEvents = createAsyncThunk<
  Event[],
  void,
  { rejectValue: string }
>('events/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    return await apiGetEvents();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch events.'),
    );
  }
});

export const fetchManagementEvents = createAsyncThunk<
  Event[],
  void,
  { rejectValue: string }
>('events/fetchManagementEvents', async (_, { rejectWithValue }) => {
  try {
    return await apiGetManagementEvents();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch management events.'),
    );
  }
});

export const fetchEventById = createAsyncThunk<
  Event,
  string,
  { rejectValue: string }
>('events/fetchEventById', async (id, { rejectWithValue }) => {
  try {
    return await apiGetEventById(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, `Failed to fetch event with ID '${id}'.`),
    );
  }
});

export const createEvent = createAsyncThunk<
  Event,
  CreateEventPayload,
  { rejectValue: string }
>('events/createEvent', async (payload, { rejectWithValue }) => {
  try {
    return await apiCreateEvent(payload);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to create event.'),
    );
  }
});

export const updateEvent = createAsyncThunk<
  Event,
  { id: string; data: UpdateEventPayload },
  { rejectValue: string }
>('events/updateEvent', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await apiUpdateEvent(id, data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to update event.'),
    );
  }
});

export const deleteEvent = createAsyncThunk<
  Event,
  string,
  { rejectValue: string }
>('events/deleteEvent', async (id, { rejectWithValue }) => {
  try {
    return await apiDeleteEvent(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to delete event.'),
    );
  }
});

export const uploadEventCoverImage = createAsyncThunk<
  Event,
  { id: string; file: File },
  { rejectValue: string }
>('events/uploadEventCoverImage', async ({ id, file }, { rejectWithValue }) => {
  try {
    return await apiUploadEventCoverImage(id, file);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to upload event cover image.'),
    );
  }
});

export const deleteEventCoverImage = createAsyncThunk<
  Event,
  string,
  { rejectValue: string }
>('events/deleteEventCoverImage', async (id, { rejectWithValue }) => {
  try {
    return await apiDeleteEventCoverImage(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to delete event cover image.'),
    );
  }
});

// Async Thunks - Event Categories
export const fetchEventCategories = createAsyncThunk<
  EventCategory[],
  void,
  { rejectValue: string }
>('events/fetchEventCategories', async (_, { rejectWithValue }) => {
  try {
    return await apiGetEventCategories();
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to fetch event categories.'),
    );
  }
});

export const createEventCategory = createAsyncThunk<
  EventCategory,
  CreateEventCategoryPayload,
  { rejectValue: string }
>('events/createEventCategory', async (payload, { rejectWithValue }) => {
  try {
    return await apiCreateEventCategory(payload);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to create event category.'),
    );
  }
});

export const updateEventCategory = createAsyncThunk<
  EventCategory,
  { id: string; data: UpdateEventCategoryPayload },
  { rejectValue: string }
>('events/updateEventCategory', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await apiUpdateEventCategory(id, data);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to update event category.'),
    );
  }
});

export const deleteEventCategory = createAsyncThunk<
  EventCategory,
  string,
  { rejectValue: string }
>('events/deleteEventCategory', async (id, { rejectWithValue }) => {
  try {
    return await apiDeleteEventCategory(id);
  } catch (error) {
    return rejectWithValue(
      extractErrorMessage(error, 'Failed to delete event category.'),
    );
  }
});

// Event Slice
export const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setSelectedEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload;
    },
    clearEventError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchEvents
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.isLoaded = true;
          state.events = action.payload;
          state.currentRequestId = null;
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        if (state.currentRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload ?? 'Failed to fetch events.';
          state.currentRequestId = null;
        }
      });

    // fetchManagementEvents
    builder
      .addCase(fetchManagementEvents.pending, (state) => {
        state.isManagementLoading = true;
        state.error = null;
      })
      .addCase(fetchManagementEvents.fulfilled, (state, action) => {
        state.isManagementLoading = false;
        state.isManagementLoaded = true;
        state.managementEvents = action.payload;
      })
      .addCase(fetchManagementEvents.rejected, (state, action) => {
        state.isManagementLoading = false;
        state.error = action.payload ?? 'Failed to fetch management events.';
      });

    // fetchEventById
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedEvent = action.payload;
        const index = state.events.findIndex(
          (event) => event.id === action.payload.id,
        );
        if (index !== -1) {
          state.events[index] = action.payload;
        } else {
          state.events.push(action.payload);
        }
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch event.';
      });

    // createEvent
    builder
      .addCase(createEvent.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        createEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSubmitting = false;
          state.managementEvents.unshift(action.payload);
          if (action.payload.status === 'PUBLISHED') {
            state.isLoaded = false;
          }
        },
      )
      .addCase(createEvent.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to create event.';
      });

    // updateEvent
    builder
      .addCase(updateEvent.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSubmitting = false;
          state.managementEvents = state.managementEvents.map((event) =>
            event.id === action.payload.id ? action.payload : event,
          );
          if (state.selectedEvent?.id === action.payload.id) {
            state.selectedEvent = action.payload;
          }

          const publicIndex = state.events.findIndex(
            (event) => event.id === action.payload.id,
          );

          if (publicIndex !== -1) {
            if (action.payload.status === 'PUBLISHED') {
              state.events[publicIndex] = action.payload;
            } else {
              state.events.splice(publicIndex, 1);
            }
            state.isLoaded = false;
          } else if (action.payload.status === 'PUBLISHED') {
            state.isLoaded = false;
          }
        },
      )
      .addCase(updateEvent.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to update event.';
      });

    // deleteEvent
    builder
      .addCase(deleteEvent.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSubmitting = false;
          state.managementEvents = state.managementEvents.filter(
            (event) => event.id !== action.payload.id,
          );
          if (state.selectedEvent?.id === action.payload.id) {
            state.selectedEvent = null;
          }

          const wasInPublic = state.events.some(
            (event) => event.id === action.payload.id,
          );
          if (wasInPublic) {
            state.events = state.events.filter(
              (event) => event.id !== action.payload.id,
            );
            state.isLoaded = false;
          }
        },
      )
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to delete event.';
      });

    // uploadEventCoverImage
    builder
      .addCase(uploadEventCoverImage.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        uploadEventCoverImage.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSubmitting = false;
          state.managementEvents = state.managementEvents.map((event) =>
            event.id === action.payload.id ? action.payload : event,
          );
          if (state.selectedEvent?.id === action.payload.id) {
            state.selectedEvent = action.payload;
          }

          const publicIndex = state.events.findIndex(
            (event) => event.id === action.payload.id,
          );

          if (publicIndex !== -1) {
            if (action.payload.status === 'PUBLISHED') {
              state.events[publicIndex] = action.payload;
            } else {
              state.events.splice(publicIndex, 1);
            }
            state.isLoaded = false;
          } else if (action.payload.status === 'PUBLISHED') {
            state.isLoaded = false;
          }
        },
      )
      .addCase(uploadEventCoverImage.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error =
          action.payload ?? 'Failed to upload event cover image.';
      });

    // deleteEventCoverImage
    builder
      .addCase(deleteEventCoverImage.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        deleteEventCoverImage.fulfilled,
        (state, action: PayloadAction<Event>) => {
          state.isSubmitting = false;
          state.managementEvents = state.managementEvents.map((event) =>
            event.id === action.payload.id ? action.payload : event,
          );
          if (state.selectedEvent?.id === action.payload.id) {
            state.selectedEvent = action.payload;
          }

          const publicIndex = state.events.findIndex(
            (event) => event.id === action.payload.id,
          );

          if (publicIndex !== -1) {
            if (action.payload.status === 'PUBLISHED') {
              state.events[publicIndex] = action.payload;
            } else {
              state.events.splice(publicIndex, 1);
            }
            state.isLoaded = false;
          } else if (action.payload.status === 'PUBLISHED') {
            state.isLoaded = false;
          }
        },
      )
      .addCase(deleteEventCoverImage.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error =
          action.payload ?? 'Failed to delete event cover image.';
      });

    // fetchEventCategories
    builder
      .addCase(fetchEventCategories.pending, (state) => {
        state.isCategoriesLoading = true;
        state.error = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.isCategoriesLoading = false;
        state.areCategoriesLoaded = true;
        state.categories = action.payload;
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.isCategoriesLoading = false;
        state.error = action.payload ?? 'Failed to fetch event categories.';
      });

    // createEventCategory
    builder
      .addCase(createEventCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        createEventCategory.fulfilled,
        (state, action: PayloadAction<EventCategory>) => {
          state.isSubmitting = false;
          state.categories.push(action.payload);
        },
      )
      .addCase(createEventCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to create event category.';
      });

    // updateEventCategory
    builder
      .addCase(updateEventCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        updateEventCategory.fulfilled,
        (state, action: PayloadAction<EventCategory>) => {
          state.isSubmitting = false;
          state.categories = state.categories.map((category) =>
            category.id === action.payload.id ? action.payload : category,
          );
          const affectsPublicEvents = state.events.some(
            (event) => event.categoryId === action.payload.id,
          );
          if (affectsPublicEvents) {
            state.events = state.events.map((event) =>
              event.categoryId === action.payload.id
                ? { ...event, category: action.payload }
                : event,
            );
          }
          state.managementEvents = state.managementEvents.map((event) =>
            event.categoryId === action.payload.id
              ? { ...event, category: action.payload }
              : event,
          );
          if (state.selectedEvent?.categoryId === action.payload.id) {
            state.selectedEvent = {
              ...state.selectedEvent,
              category: action.payload,
            };
          }
        },
      )
      .addCase(updateEventCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to update event category.';
      });

    // deleteEventCategory
    builder
      .addCase(deleteEventCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        deleteEventCategory.fulfilled,
        (state, action: PayloadAction<EventCategory>) => {
          state.isSubmitting = false;
          state.categories = state.categories.filter(
            (category) => category.id !== action.payload.id,
          );
        },
      )
      .addCase(deleteEventCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? 'Failed to delete event category.';
      });

    // reset state on logout
    builder.addCase(logout, (state) => {
      state.managementEvents = [];
      state.isManagementLoading = false;
      state.isManagementLoaded = false;
      state.selectedEvent = null;
      state.isSubmitting = false;
      state.error = null;
    });
  },
});

export const { setSelectedEvent, clearEventError } = eventSlice.actions;
export const eventReducer = eventSlice.reducer;
export default eventReducer;

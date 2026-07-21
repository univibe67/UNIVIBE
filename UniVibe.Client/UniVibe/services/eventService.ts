import { api } from "./api";

export interface EventDto {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  categoryId: string;
  imageUrl?: string | null;
}

export interface EventCategoryDto {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const emptyResult = <T>(
  pageNumber: number,
  pageSize: number,
): PaginatedResult<T> => ({
  items: [],
  totalCount: 0,
  pageNumber,
  pageSize,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});

export const eventService = {
  async getEvents(
    pageNumber = 1,
    pageSize = 10,
    onlyActive = true,
  ): Promise<PaginatedResult<EventDto>> {
    const data = await api.get("/Events/all-events", {
      params: { pageNumber, pageSize, onlyActive },
    });

    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray((data as any).items)
    ) {
      return emptyResult<EventDto>(pageNumber, pageSize);
    }

    return data as PaginatedResult<EventDto>;
  },

  async getCategories(): Promise<EventCategoryDto[]> {
    const data = await api.get("/EventCategories/event-categories");
    return Array.isArray(data) ? data : [];
  },
};

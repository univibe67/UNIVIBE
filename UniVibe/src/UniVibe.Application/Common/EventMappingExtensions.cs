using Microsoft.Extensions.Localization;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Common
{
    public static class EventMappingExtensions
    {
        public static EventDetailResponse MapWithLocalization(this EventDetailResponse response, Event entity, IStringLocalizer<SharedResources> localizer)
        {
            if (entity.Category != null)
            {
                response.CategoryId = entity.Category.Id;
                response.CategoryName = localizer[entity.Category.Name].Value;
            }
            return response;
        }

        public static List<EventListResponse> MapListWithLocalization(this List<EventListResponse> responses, List<Event> entities, IStringLocalizer<SharedResources> localizer)
        {
            for (int i = 0; i < responses.Count; i++)
            {
                var original = entities[i];
                var item = responses[i];

                if (original.Category != null)
                {
                    item.CategoryId = original.Category.Id;
                    item.CategoryName = localizer[original.Category.Name].Value;
                }
            }
            return responses;
        }
        public static List<EventDetailResponse> MapListWithLocalization(this List<EventDetailResponse> responses, List<Event> entities, IStringLocalizer<SharedResources> localizer)
        {
            for (int i = 0; i < responses.Count; i++)
            {
                var original = entities[i];
                var response = responses[i];

                if (original.Category != null)
                {
                    response.CategoryId = original.Category.Id;
                    response.CategoryName = localizer[original.Category.Name].Value;
                }
            }
            return responses;
        }

    }
}
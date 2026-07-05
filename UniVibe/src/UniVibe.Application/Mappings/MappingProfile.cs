using AutoMapper;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.DTOs.University;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // University Mappings
            CreateMap<University, UniversityLookupDto>();
            CreateMap<Faculty, FacultyLookupDto>();
            CreateMap<Department, DepartmentLookupDto>();

            //Event Mappings
            CreateMap<CreateEventDto, Event>();
            CreateMap<Event, EventDto>();
            CreateMap<EventCategory, EventCategoryDto>();

        }
    }
}

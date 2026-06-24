using StudyWise.Application.DTOs.Topics;

namespace StudyWise.Application.Interfaces;

public interface ITopicService
{
    Task<IEnumerable<TopicDto>> GetByCourseAsync(int courseId, Guid userId);
    Task<TopicDto?> GetByIdAsync(int id, Guid userId);
    Task<TopicDto> CreateAsync(int courseId, CreateTopicDto dto, Guid userId);
    Task<TopicDto?> UpdateAsync(int id, UpdateTopicDto dto, Guid userId);
    Task<bool> DeleteAsync(int id, Guid userId);
}
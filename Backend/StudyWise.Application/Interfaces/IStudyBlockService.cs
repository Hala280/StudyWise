using StudyWise.Application.DTOs.StudyBlocks;

namespace StudyWise.Application.Interfaces;

public interface IStudyBlockService
{
    Task<IEnumerable<StudyBlockDto>> GetAsync(Guid userId, DateOnly? startDate, DateOnly? endDate);
    Task<StudyBlockDto?> GetByIdAsync(int id, Guid userId);
    Task<StudyBlockDto?> CreateAsync(CreateStudyBlockDto dto, Guid userId);
    Task<StudyBlockDto?> UpdateAsync(int id, UpdateStudyBlockDto dto, Guid userId);
    Task<bool> DeleteAsync(int id, Guid userId);
}

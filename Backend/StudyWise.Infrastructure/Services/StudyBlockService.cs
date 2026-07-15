using Microsoft.EntityFrameworkCore;
using StudyWise.Application.DTOs.StudyBlocks;
using StudyWise.Application.Interfaces;
using StudyWise.Domain.Entities;
using StudyWise.Infrastructure.Persistence;

namespace StudyWise.Infrastructure.Services;

public class StudyBlockService : IStudyBlockService
{
    private readonly StudyWiseDbContext _context;

    public StudyBlockService(StudyWiseDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StudyBlockDto>> GetAsync(Guid userId, DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.StudyBlocks
            .Include(s => s.Topic)
            .ThenInclude(t => t.Course)
            .Where(s => s.UserId == userId);

        if (startDate.HasValue)
        {
            query = query.Where(s => s.ScheduledDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(s => s.ScheduledDate <= endDate.Value);
        }

        return await query
            .OrderBy(s => s.ScheduledDate)
            .ThenBy(s => s.StartTime)
            .Select(s => new StudyBlockDto
            {
                Id = s.Id,
                TopicId = s.TopicId,
                CourseId = s.Topic.CourseId,
                TopicTitle = s.Topic.Title,
                CourseTitle = s.Topic.Course.Title,
                ScheduledDate = s.ScheduledDate,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DurationMinutes = s.DurationMinutes,
                IsCompleted = s.IsCompleted,
                IsMissed = s.IsMissed
            })
            .ToListAsync();
    }

    public async Task<StudyBlockDto?> GetByIdAsync(int id, Guid userId)
    {
        return await _context.StudyBlocks
            .Include(s => s.Topic)
            .ThenInclude(t => t.Course)
            .Where(s => s.Id == id && s.UserId == userId)
            .Select(s => new StudyBlockDto
            {
                Id = s.Id,
                TopicId = s.TopicId,
                CourseId = s.Topic.CourseId,
                TopicTitle = s.Topic.Title,
                CourseTitle = s.Topic.Course.Title,
                ScheduledDate = s.ScheduledDate,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DurationMinutes = s.DurationMinutes,
                IsCompleted = s.IsCompleted,
                IsMissed = s.IsMissed
            })
            .FirstOrDefaultAsync();
    }

    public async Task<StudyBlockDto?> CreateAsync(CreateStudyBlockDto dto, Guid userId)
    {
        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == dto.TopicId && t.Course.UserId == userId);

        if (topic is null) return null;

        var block = new StudyBlock
        {
            TopicId = dto.TopicId,
            UserId = userId,
            ScheduledDate = dto.ScheduledDate,
            StartTime = dto.StartTime,
            DurationMinutes = Math.Max(1, dto.DurationMinutes),
            IsCompleted = false,
            IsMissed = false
        };
        block.EndTime = block.StartTime.AddMinutes(block.DurationMinutes);

        _context.StudyBlocks.Add(block);
        await _context.SaveChangesAsync();

        block.Topic = topic;
        return ToDto(block);
    }

    public async Task<StudyBlockDto?> UpdateAsync(int id, UpdateStudyBlockDto dto, Guid userId)
    {
        var block = await _context.StudyBlocks
            .Include(s => s.Topic)
            .ThenInclude(t => t.Course)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (block is null) return null;

        var topic = await _context.Topics
            .Include(t => t.Course)
            .FirstOrDefaultAsync(t => t.Id == dto.TopicId && t.Course.UserId == userId);

        if (topic is null) return null;

        block.TopicId = dto.TopicId;
        block.Topic = topic;
        block.ScheduledDate = dto.ScheduledDate;
        block.StartTime = dto.StartTime;
        block.DurationMinutes = Math.Max(1, dto.DurationMinutes);
        block.EndTime = block.StartTime.AddMinutes(block.DurationMinutes);
        block.IsCompleted = dto.IsCompleted;
        block.IsMissed = dto.IsMissed;

        await _context.SaveChangesAsync();
        return ToDto(block);
    }

    public async Task<bool> DeleteAsync(int id, Guid userId)
    {
        var block = await _context.StudyBlocks
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (block is null) return false;

        _context.StudyBlocks.Remove(block);
        await _context.SaveChangesAsync();
        return true;
    }

    private static StudyBlockDto ToDto(StudyBlock block)
    {
        return new StudyBlockDto
        {
            Id = block.Id,
            TopicId = block.TopicId,
            CourseId = block.Topic.CourseId,
            TopicTitle = block.Topic.Title,
            CourseTitle = block.Topic.Course.Title,
            ScheduledDate = block.ScheduledDate,
            StartTime = block.StartTime,
            EndTime = block.EndTime,
            DurationMinutes = block.DurationMinutes,
            IsCompleted = block.IsCompleted,
            IsMissed = block.IsMissed
        };
    }
}

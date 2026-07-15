namespace StudyWise.Application.DTOs.StudyBlocks;

public class StudyBlockDto
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public int CourseId { get; set; }
    public string TopicTitle { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public DateOnly ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsMissed { get; set; }
}

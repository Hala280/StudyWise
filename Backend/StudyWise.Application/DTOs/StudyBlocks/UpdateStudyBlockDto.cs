namespace StudyWise.Application.DTOs.StudyBlocks;

public class UpdateStudyBlockDto
{
    public int TopicId { get; set; }
    public DateOnly ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsMissed { get; set; }
}

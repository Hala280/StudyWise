namespace StudyWise.Application.DTOs.StudyBlocks;

public class CreateStudyBlockDto
{
    public int TopicId { get; set; }
    public DateOnly ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMinutes { get; set; }
}

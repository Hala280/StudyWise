namespace StudyWise.API.Models;

public class StudyBlock
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateOnly ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsCompleted { get; set; } = false;
    public bool IsMissed { get; set; } = false;
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public Topic Topic { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
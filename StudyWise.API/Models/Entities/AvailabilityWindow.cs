namespace StudyWise.API.Models;

public class AvailabilityWindow
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }   // 0=Sunday ... 6=Saturday
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
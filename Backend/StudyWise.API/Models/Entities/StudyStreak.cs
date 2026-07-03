namespace StudyWise.API.Models;

public class StudyStreak
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateOnly StreakDate { get; set; }
    public int BlocksCompleted { get; set; }
    public int MinutesStudied { get; set; }

    public ApplicationUser User { get; set; } = null!;
}

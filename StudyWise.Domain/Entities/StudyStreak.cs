namespace StudyWise.Domain.Entities;

public class StudyStreak
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly StreakDate { get; set; }
    public int BlocksCompleted { get; set; }
    public int MinutesStudied { get; set; }
}
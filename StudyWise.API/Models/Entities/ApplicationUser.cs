using Microsoft.AspNetCore.Identity;

namespace StudyWise.API.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<AvailabilityWindow> AvailabilityWindows { get; set; } = new List<AvailabilityWindow>();
    public ICollection<StudyBlock> StudyBlocks { get; set; } = new List<StudyBlock>();
    public ICollection<ExamEvent> ExamEvents { get; set; } = new List<ExamEvent>();
    public ICollection<StudyStreak> StudyStreaks { get; set; } = new List<StudyStreak>();
}
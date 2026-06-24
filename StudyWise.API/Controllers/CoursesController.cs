using Microsoft.AspNetCore.Mvc;
using StudyWise.Application.DTOs.Courses;
using StudyWise.Application.Interfaces;

namespace StudyWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    // Temporary hardcoded userId until auth is wired up
    private Guid CurrentUserId => Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var courses = await _courseService.GetAllAsync(CurrentUserId);
        return Ok(courses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var course = await _courseService.GetByIdAsync(id, CurrentUserId);
        if (course is null) return NotFound();
        return Ok(course);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourseDto dto)
    {
        var course = await _courseService.CreateAsync(dto, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseDto dto)
    {
        var course = await _courseService.UpdateAsync(id, dto, CurrentUserId);
        if (course is null) return NotFound();
        return Ok(course);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _courseService.DeleteAsync(id, CurrentUserId);
        if (!result) return NotFound();
        return NoContent();
    }
}
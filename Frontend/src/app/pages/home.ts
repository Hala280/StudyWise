import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-6">
      <section class="py-20 relative">
        <div class="absolute -top-4 left-0 w-40 h-40 eraser-smudge rounded-full pointer-events-none classic-only-decor"></div>

        <p class="font-hand text-2xl accent mb-4">Lesson 1: how to actually remember this</p>
        <h1 class="font-display text-6xl sm:text-7xl leading-[1.1] max-w-3xl">
          You don't have a
          <span class="chalk-underline">
            memory problem
            <svg viewBox="0 0 300 10" preserveAspectRatio="none"><path d="M2 6 Q150 0 298 6" stroke="#E8C468" stroke-width="3" fill="none" stroke-linecap="round" /></svg>
          </span>
          - you have a review problem.
        </h1>
        <p class="mt-8 text-lg surface-muted max-w-xl leading-relaxed font-body">
          StudyWise turns courses, topics, and study blocks into a weekly plan you can actually follow.
        </p>
        <div class="mt-10 flex flex-wrap items-center gap-5">
          <a routerLink="/courses" class="cta-primary rounded-md px-7 py-3.5 text-base font-semibold hover:brightness-110 transition">
            Start with courses
          </a>
          <a routerLink="/planner" class="cta-secondary box-border rounded-md px-7 py-3.5 text-base transition">
            Open planner
          </a>
        </div>
      </section>

      <section class="py-16 border-t hairline">
        <p class="font-hand text-2xl accent mb-10">today's agenda:</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div class="box-border p-6">
            <span class="font-display text-4xl accent-2">1.</span>
            <h3 class="text-lg font-semibold mt-3 mb-2">Add courses</h3>
            <p class="text-sm surface-muted font-body">Track topics, estimated time, and exam dates in one place.</p>
          </div>
          <div class="box-border p-6">
            <span class="font-display text-4xl accent-2">2.</span>
            <h3 class="text-lg font-semibold mt-3 mb-2">Mark progress</h3>
            <p class="text-sm surface-muted font-body">See what is done and what still needs focus before the exam.</p>
          </div>
          <div class="box-border p-6">
            <span class="font-display text-4xl accent-2">3.</span>
            <h3 class="text-lg font-semibold mt-3 mb-2">Plan the week</h3>
            <p class="text-sm surface-muted font-body">Use study blocks to map topics to real time on your calendar.</p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class HomePage {}

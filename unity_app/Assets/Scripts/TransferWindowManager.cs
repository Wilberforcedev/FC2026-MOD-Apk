using System;
using UnityEngine;

namespace FC2026
{
    /// <summary>
    /// Controls the two configurable transfer periods using the season matchweek.
    /// Defaults represent an opening window and a mid-season window.
    /// </summary>
    public sealed class TransferWindowManager : MonoBehaviour
    {
        [SerializeField] private SeasonCalendarManager calendar;
        [SerializeField, Min(1)] private int firstWindowStartMatchweek = 1;
        [SerializeField, Min(1)] private int firstWindowEndMatchweek = 3;
        [SerializeField, Min(1)] private int secondWindowStartMatchweek = 15;
        [SerializeField, Min(1)] private int secondWindowEndMatchweek = 17;

        public int CurrentMatchweek { get; private set; } = 1;
        public bool IsWindowOpen => IsWindowOpenFor(CurrentMatchweek);
        public string StatusLabel => IsWindowOpen ? "TRANSFER WINDOW OPEN" : "TRANSFER WINDOW CLOSED";
        public event Action WindowStateChanged;

        private void Awake()
        {
            calendar ??= FindFirstObjectByType<SeasonCalendarManager>();
            RefreshFromCalendar();
        }

        private void OnEnable()
        {
            if (calendar != null) calendar.CalendarChanged += RefreshFromCalendar;
        }

        private void OnDisable()
        {
            if (calendar != null) calendar.CalendarChanged -= RefreshFromCalendar;
        }

        public void Configure(SeasonCalendarManager seasonCalendar)
        {
            if (calendar != null) calendar.CalendarChanged -= RefreshFromCalendar;
            calendar = seasonCalendar;
            if (isActiveAndEnabled && calendar != null) calendar.CalendarChanged += RefreshFromCalendar;
            RefreshFromCalendar();
        }

        public bool IsWindowOpenFor(int matchweek)
        {
            return IsInRange(matchweek, firstWindowStartMatchweek, firstWindowEndMatchweek) ||
                   IsInRange(matchweek, secondWindowStartMatchweek, secondWindowEndMatchweek);
        }

        public void SetWindowPeriods(int firstStart, int firstEnd, int secondStart, int secondEnd)
        {
            firstWindowStartMatchweek = Mathf.Max(1, firstStart);
            firstWindowEndMatchweek = Mathf.Max(firstWindowStartMatchweek, firstEnd);
            secondWindowStartMatchweek = Mathf.Max(1, secondStart);
            secondWindowEndMatchweek = Mathf.Max(secondWindowStartMatchweek, secondEnd);
            WindowStateChanged?.Invoke();
        }

        public void RefreshFromCalendar()
        {
            var next = calendar?.NextFixture;
            var nextWeek = next != null ? next.matchweek :
                calendar != null && calendar.Fixtures.Count > 0
                    ? calendar.Fixtures[calendar.Fixtures.Count - 1].matchweek + 1
                    : 1;
            if (CurrentMatchweek == nextWeek)
            {
                WindowStateChanged?.Invoke();
                return;
            }
            CurrentMatchweek = Mathf.Max(1, nextWeek);
            WindowStateChanged?.Invoke();
        }

        private static bool IsInRange(int value, int start, int end) => value >= start && value <= end;
    }
}

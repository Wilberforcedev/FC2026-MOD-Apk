using System;
using UnityEngine;

namespace FC2026.Core
{
    /// <summary>
    /// Data-driven formation presets and simple team mentality adjustments.
    /// Positions are relative to the centre of the pitch; the managed team
    /// attacks toward positive Z. Index 0 is always the goalkeeper.
    /// </summary>
    public static class CareerFormationSystem
    {
        public static readonly string[] FormationIds = { "4-3-3", "4-2-3-1", "4-4-2", "3-5-2" };
        public static readonly string[] TacticalStyles = { "Balanced", "Attacking", "Defensive" };

        private static readonly Vector3[] Formation433 =
        {
            new(0, 0, -48),
            new(-23, 0, -36), new(-8, 0, -39), new(8, 0, -39), new(23, 0, -36),
            new(-15, 0, -18), new(0, 0, -21), new(15, 0, -18),
            new(-21, 0, 4), new(0, 0, 11), new(21, 0, 4)
        };

        private static readonly Vector3[] Formation4231 =
        {
            new(0, 0, -48),
            new(-23, 0, -36), new(-8, 0, -39), new(8, 0, -39), new(23, 0, -36),
            new(-10, 0, -21), new(10, 0, -21),
            new(-21, 0, -2), new(0, 0, 1), new(21, 0, -2),
            new(0, 0, 12)
        };

        private static readonly Vector3[] Formation442 =
        {
            new(0, 0, -48),
            new(-23, 0, -36), new(-8, 0, -39), new(8, 0, -39), new(23, 0, -36),
            new(-23, 0, -17), new(-8, 0, -19), new(8, 0, -19), new(23, 0, -17),
            new(-10, 0, 5), new(10, 0, 7)
        };

        private static readonly Vector3[] Formation352 =
        {
            new(0, 0, -48),
            new(-17, 0, -37), new(0, 0, -40), new(17, 0, -37),
            new(-27, 0, -17), new(-13, 0, -19), new(0, 0, -21),
            new(13, 0, -19), new(27, 0, -17),
            new(-9, 0, 5), new(9, 0, 7)
        };

        public static bool IsValidFormation(string id)
        {
            return Array.IndexOf(FormationIds, id) >= 0;
        }

        public static bool IsValidTacticalStyle(string style)
        {
            return Array.IndexOf(TacticalStyles, style) >= 0;
        }

        public static string NormalizeFormation(string id)
        {
            return IsValidFormation(id) ? id : FormationIds[0];
        }

        public static string NormalizeTacticalStyle(string style)
        {
            return IsValidTacticalStyle(style) ? style : TacticalStyles[0];
        }

        public static Vector3[] GetPositions(string formationId, string tacticalStyle)
        {
            var source = NormalizeFormation(formationId) switch
            {
                "4-2-3-1" => Formation4231,
                "4-4-2" => Formation442,
                "3-5-2" => Formation352,
                _ => Formation433
            };

            var positions = (Vector3[])source.Clone();
            var style = NormalizeTacticalStyle(tacticalStyle);
            var forwardShift = style == "Attacking" ? 5f : style == "Defensive" ? -5f : 0f;
            var widthScale = style == "Attacking" ? 1.08f : style == "Defensive" ? 0.9f : 1f;

            for (var i = 1; i < positions.Length; i++)
            {
                var point = positions[i];
                var isForward = i >= 9;
                positions[i] = new Vector3(point.x * widthScale, point.y,
                    point.z + (isForward ? forwardShift : forwardShift * 0.45f));
            }

            return positions;
        }
    }
}

using System;

namespace BankScoreEvaluator.Web.Models
{
    /// <summary>
    /// Resultado del calculo del score bancario para un solicitante.
    /// </summary>
    public class ScoreResult
    {
        public int Id { get; set; }
        public int ApplicantId { get; set; }
        public int Score { get; set; }
        public string Category { get; set; }
        public string Recommendation { get; set; }
        public decimal DebtIncomeRatio { get; set; }
        public int ScoreCapacidad { get; set; }
        public int ScoreHistorial { get; set; }
        public int ScoreEndeudamiento { get; set; }
        public int ScoreEmpleo { get; set; }
        public int ScoreEdad { get; set; }
        public string RawSqlUsed { get; set; }
        public DateTime EvaluatedAt { get; set; }
    }
}

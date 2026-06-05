using System;

namespace BankScoreEvaluator.Web.Models
{
    /// <summary>
    /// Solicitante o cliente para evaluacion de score bancario.
    /// </summary>
    public class Applicant
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Document { get; set; }
        public string Email { get; set; }
        public int Age { get; set; }
        public decimal MonthlyIncome { get; set; }
        public decimal MonthlyExpenses { get; set; }
        public decimal TotalDebt { get; set; }
        public int CreditHistoryMonths { get; set; }
        public bool HasPreviousDefault { get; set; }
        public int NumberOfLoans { get; set; }
        public string EmploymentType { get; set; }
        public DateTime RegisteredAt { get; set; }
    }
}

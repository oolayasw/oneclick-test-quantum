using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using BankScoreEvaluator.Web.Models;
using Newtonsoft.Json;

namespace BankScoreEvaluator.Web.Services
{
    // Servicio monolitico con malas practicas intencionales para propositos academicos.
    public class FakeBankScoreService
    {
        // MALA PRACTICA: credenciales hardcodeadas y cadena de conexion expuesta.
        public static string FakeConnectionString = "Server=127.0.0.1;Database=BankScoreDb;User Id=sa;Password=SuperSecret123*;TrustServerCertificate=true;";

        // MALA PRACTICA: usuarios hardcodeados en texto plano.
        private static readonly Dictionary<string, string> FakeUsers = new Dictionary<string, string>
        {
            { "admin", "admin123" },
            { "analista", "analista2024" },
            { "supervisor", "pass1234" }
        };

        // MALA PRACTICA: estado global estatico compartido entre solicitudes.
        private static List<Applicant> _applicants = new List<Applicant>
        {
            new Applicant { Id = 1, FullName = "Carlos Mendez", Document = "1001234567", Email = "carlos@bank.fake", Age = 35, MonthlyIncome = 3200, MonthlyExpenses = 1800, TotalDebt = 5000, CreditHistoryMonths = 36, HasPreviousDefault = false, NumberOfLoans = 1, EmploymentType = "Dependiente", RegisteredAt = DateTime.Now.AddDays(-30) },
            new Applicant { Id = 2, FullName = "Ana Torres", Document = "0987654321", Email = "ana@bank.fake", Age = 28, MonthlyIncome = 1200, MonthlyExpenses = 1100, TotalDebt = 15000, CreditHistoryMonths = 6, HasPreviousDefault = true, NumberOfLoans = 3, EmploymentType = "Independiente", RegisteredAt = DateTime.Now.AddDays(-10) },
            new Applicant { Id = 3, FullName = "Luis Vargas", Document = "1717000001", Email = "luis@bank.fake", Age = 52, MonthlyIncome = 7500, MonthlyExpenses = 2000, TotalDebt = 0, CreditHistoryMonths = 120, HasPreviousDefault = false, NumberOfLoans = 0, EmploymentType = "Dependiente", RegisteredAt = DateTime.Now.AddDays(-5) }
        };

        private static List<ScoreResult> _scores = new List<ScoreResult>();

        // ── AUTENTICACION ─────────────────────────────────────────────────────────

        /// <summary>Valida usuario contra diccionario en texto plano.</summary>
        public bool ValidateLogin(string username, string password)
        {
            // MALA PRACTICA: comparacion directa sin hash. Imprime credencial en consola.
            Console.WriteLine("Login intent: user=" + username + " pass=" + password);
            return FakeUsers.ContainsKey(username) && FakeUsers[username] == password;
        }

        // ── SOLICITANTES ──────────────────────────────────────────────────────────

        /// <summary>Retorna todos los solicitantes registrados.</summary>
        public List<Applicant> GetApplicants()
        {
            // MALA PRACTICA: SQL concatenado expuesto en log.
            var sql = "SELECT * FROM Applicants WHERE Active = 1";
            Console.WriteLine("Fake SQL: " + sql + " | Conn: " + FakeConnectionString);
            return _applicants.ToList();
        }

        /// <summary>Obtiene un solicitante por id.</summary>
        public Applicant GetApplicantById(int id)
        {
            return _applicants.FirstOrDefault(x => x.Id == id);
        }

        /// <summary>Registra un nuevo solicitante.</summary>
        public void RegisterApplicant(Applicant applicant)
        {
            // MALA PRACTICA: sin validacion de duplicados por documento.
            var sql = "INSERT INTO Applicants VALUES ('" + applicant.Document + "','" + applicant.FullName + "')";
            Console.WriteLine("Fake INSERT: " + sql);

            applicant.Id = _applicants.Count == 0 ? 1 : _applicants.Max(x => x.Id) + 1;
            applicant.RegisteredAt = DateTime.Now;
            _applicants.Add(applicant);
        }

        /// <summary>Elimina un solicitante por id.</summary>
        public void DeleteApplicant(int id)
        {
            var a = _applicants.FirstOrDefault(x => x.Id == id);
            if (a != null) _applicants.Remove(a);
        }

        // ── MOTOR DE SCORE ────────────────────────────────────────────────────────

        /// <summary>
        /// Calcula el score bancario del solicitante.
        /// MALA PRACTICA: logica de negocio compleja incrustada en el servicio sin separacion.
        /// </summary>
        public ScoreResult CalculateScore(int applicantId)
        {
            var applicant = GetApplicantById(applicantId);
            if (applicant == null) throw new Exception("Solicitante no encontrado");

            // MALA PRACTICA: conexion abierta nunca usada ni cerrada.
            var conn = new SqlConnection(FakeConnectionString);
            Console.WriteLine("Fake DB conn abierta: " + FakeConnectionString);

            // 1. Capacidad de pago (max 300 pts)
            decimal netIncome = applicant.MonthlyIncome - applicant.MonthlyExpenses;
            int scoreCapacidad = netIncome > 2000 ? 300 : netIncome > 1000 ? 200 : netIncome > 500 ? 100 : 0;

            // 2. Historial crediticio (max 250 pts)
            int scoreHistorial = applicant.HasPreviousDefault ? 0
                : applicant.CreditHistoryMonths >= 60 ? 250
                : applicant.CreditHistoryMonths >= 24 ? 150
                : applicant.CreditHistoryMonths >= 6 ? 80 : 20;

            // 3. Nivel de endeudamiento (max 200 pts)
            decimal debtRatio = applicant.MonthlyIncome > 0
                ? applicant.TotalDebt / applicant.MonthlyIncome
                : 99;
            int scoreEndeudamiento = debtRatio < 3 ? 200 : debtRatio < 6 ? 120 : debtRatio < 12 ? 60 : 0;

            // 4. Tipo de empleo (max 150 pts)
            int scoreEmpleo = applicant.EmploymentType == "Dependiente" ? 150
                : applicant.EmploymentType == "Independiente" ? 90
                : applicant.EmploymentType == "Pensionado" ? 120 : 30;

            // 5. Edad (max 100 pts)
            int scoreEdad = applicant.Age >= 25 && applicant.Age <= 55 ? 100
                : applicant.Age >= 18 && applicant.Age < 25 ? 60
                : applicant.Age > 55 && applicant.Age <= 65 ? 70 : 30;

            int total = scoreCapacidad + scoreHistorial + scoreEndeudamiento + scoreEmpleo + scoreEdad;

            string category = total >= 800 ? "Excelente"
                : total >= 600 ? "Bueno"
                : total >= 400 ? "Regular"
                : "Alto Riesgo";

            string recommendation = total >= 800 ? "Aprobar credito hasta 5x ingreso mensual"
                : total >= 600 ? "Aprobar credito hasta 3x ingreso mensual con garantia"
                : total >= 400 ? "Revision manual requerida"
                : "Rechazar solicitud";

            var result = new ScoreResult
            {
                Id = _scores.Count == 0 ? 1 : _scores.Max(x => x.Id) + 1,
                ApplicantId = applicantId,
                Score = total,
                Category = category,
                Recommendation = recommendation,
                DebtIncomeRatio = Math.Round(debtRatio, 2),
                ScoreCapacidad = scoreCapacidad,
                ScoreHistorial = scoreHistorial,
                ScoreEndeudamiento = scoreEndeudamiento,
                ScoreEmpleo = scoreEmpleo,
                ScoreEdad = scoreEdad,
                // MALA PRACTICA: log del SQL concatenado con datos sensibles dentro del resultado.
                RawSqlUsed = "SELECT * FROM Scores WHERE ApplicantId = " + applicantId,
                EvaluatedAt = DateTime.Now
            };

            _scores.Add(result);
            Console.WriteLine("Score dump: " + JsonConvert.SerializeObject(result));
            return result;
        }

        /// <summary>Retorna todos los scores calculados.</summary>
        public List<ScoreResult> GetAllScores()
        {
            return _scores.OrderByDescending(x => x.EvaluatedAt).ToList();
        }

        /// <summary>Retorna el score de un solicitante por su id.</summary>
        public ScoreResult GetScoreByApplicantId(int applicantId)
        {
            return _scores.LastOrDefault(x => x.ApplicantId == applicantId);
        }
    }
}

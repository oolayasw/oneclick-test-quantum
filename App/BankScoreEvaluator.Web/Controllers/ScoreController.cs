using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BankScoreEvaluator.Web.Services;

namespace BankScoreEvaluator.Web.Controllers
{
    // Motor de evaluacion de score bancario.
    public class ScoreController : Controller
    {
        private static FakeBankScoreService _service = new FakeBankScoreService();

        public IActionResult Index()
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            ViewBag.Applicants = _service.GetApplicants();
            ViewBag.Scores = _service.GetAllScores();
            return View();
        }

        [HttpPost]
        public IActionResult Evaluate(int applicantId)
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            try
            {
                var result = _service.CalculateScore(applicantId);
                return View("Result", result);
            }
            catch (Exception ex)
            {
                // MALA PRACTICA: excepcion ignorada con mensaje generico.
                ViewBag.Error = ex.Message;
                ViewBag.Applicants = _service.GetApplicants();
                ViewBag.Scores = _service.GetAllScores();
                return View("Index");
            }
        }

        public IActionResult History()
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            return View(_service.GetAllScores());
        }
    }
}

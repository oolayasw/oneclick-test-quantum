using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BankScoreEvaluator.Web.Models;
using BankScoreEvaluator.Web.Services;

namespace BankScoreEvaluator.Web.Controllers
{
    // MALA PRACTICA: sin filtro de autorizacion centralizado, cada accion verifica sesion a mano.
    public class ApplicantsController : Controller
    {
        private static FakeBankScoreService _service = new FakeBankScoreService();

        public IActionResult Index()
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            return View(_service.GetApplicants());
        }

        public IActionResult Details(int id)
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            var model = _service.GetApplicantById(id);
            if (model == null) return RedirectToAction("Index");

            ViewBag.Score = _service.GetScoreByApplicantId(id);
            return View(model);
        }

        [HttpGet]
        public IActionResult Create()
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            return View(new Applicant());
        }

        [HttpPost]
        public IActionResult Create(Applicant applicant)
        {
            // MALA PRACTICA: sin validacion de modelo, sin manejo de errores.
            _service.RegisterApplicant(applicant);
            TempData["Msg"] = "Solicitante registrado";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public IActionResult DeleteConfirmed(int id)
        {
            if (HttpContext.Session.GetString("User") == null)
                return RedirectToAction("Login", "Account");

            _service.DeleteApplicant(id);
            return RedirectToAction("Index");
        }
    }
}

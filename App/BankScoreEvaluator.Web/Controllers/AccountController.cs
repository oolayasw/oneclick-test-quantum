using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BankScoreEvaluator.Web.Models;
using BankScoreEvaluator.Web.Services;

namespace BankScoreEvaluator.Web.Controllers
{
    // Controlador de autenticacion fake sin cifrado ni proteccion adecuada.
    public class AccountController : Controller
    {
        private static FakeBankScoreService _service = new FakeBankScoreService();

        [HttpGet]
        public IActionResult Login()
        {
            if (HttpContext.Session.GetString("User") != null)
                return RedirectToAction("Index", "Applicants");

            return View(new LoginModel());
        }

        [HttpPost]
        public IActionResult Login(LoginModel model)
        {
            // MALA PRACTICA: sin anti-forgery token, sin rate limiting.
            if (_service.ValidateLogin(model.Username, model.Password))
            {
                // MALA PRACTICA: guardar usuario en sesion como texto plano.
                HttpContext.Session.SetString("User", model.Username);
                return RedirectToAction("Index", "Applicants");
            }

            ViewBag.Error = "Usuario o contrasena incorrectos";
            return View(model);
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }
    }
}

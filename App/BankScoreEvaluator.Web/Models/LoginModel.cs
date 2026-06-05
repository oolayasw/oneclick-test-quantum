namespace BankScoreEvaluator.Web.Models
{
    /// <summary>
    /// Modelo de autenticacion fake para el sistema de score bancario.
    /// </summary>
    public class LoginModel
    {
        /// <summary>Nombre de usuario.</summary>
        public string Username { get; set; }

        /// <summary>Contrasena en texto plano (mala practica intencional).</summary>
        public string Password { get; set; }
    }
}

import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import { Button } from "../components/button";

export function Welcome() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 gap-3">
     <div className="flex gap-4 flex-col justify-center items-center w-full pb-5">
       <div className="w-[150px] md:w-[100px] max-w-[100vw] flex justify-center items-center text-center">
        <img src={logoLight} alt="Eclipse" className="block w-full dark:hidden" />
        <img src={logoDark} alt="Eclipse" className="hidden w-full dark:block" />
      </div>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100 text-center">Welcome to Eclipse!</h1>
      </div>
       <p className="text-md text-gray-700 dark:text-gray-200 text-center" style={{ maxWidth: "600px" }}>
              Hello there!
              <br /><br />
              Thank you so much for testing the current build of Eclipse. Your support means a <strong>LOT</strong> to me as I continue to develop and improve this project.
              I want to make Eclipse the <strong>best messaging platform</strong> it can be, and your feedback is <strong>crucial</strong> in helping me achieve that goal.
              <br/><br />
              Now that you're here, feel free to explore the app and its features.
              If you encounter any bugs or have suggestions for new features, please don't hesitate to reach out to me directly at <a href="mailto:tris_went@icloud.com" className="underline">tris_went@icloud.com</a>.
              And remember, your feedback is what helps me make Eclipse better for everyone.
              <br /><strong>-- Tristan, Creator of Eclipse</strong>
             </p>

             <Button variant="primary" to="/auth" className="mt-4 px-6 py-2">
              Get Started
             </Button>
    </main>
  );
}
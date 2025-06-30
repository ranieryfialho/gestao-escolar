import ReplacementCalculator from "../components/ReplacementCalculator";

function CalculatorPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Calculadora de Reposição de Aulas
      </h1>
      <div className="max-w-4xl mx-auto">
        <ReplacementCalculator />
      </div>
    </div>
  );
}

export default CalculatorPage;
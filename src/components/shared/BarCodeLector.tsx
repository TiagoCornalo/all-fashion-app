import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const BarcodeReaderWithCamera = () => {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div>
      <h1>Escanear Código de Barras</h1>
      {!isStarted ? (
        <button onClick={() => setIsStarted(true)}>
          Iniciar Escáner
        </button>
      ) : (
        <>
          <BarcodeScannerComponent
            width={300}
            height={300}
            torch={false}
            facingMode="environment"
            onUpdate={(err, result) => {
              if (result) {
                setBarcode(result.getText());
                setIsStarted(false);
                console.log("Código escaneado:", result.getText());
              } else if (err) {
                setError("Error al acceder a la cámara");
                console.error(err);
              }
            }}
          />
          <button onClick={() => setIsStarted(false)}>
            Detener Escáner
          </button>
        </>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {barcode && <p>Código escaneado: {barcode}</p>}
    </div>
  );
};

export default BarcodeReaderWithCamera;

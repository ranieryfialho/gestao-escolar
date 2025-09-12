import React, { useState, useEffect, useCallback } from 'react';
import Slider from 'react-slick';
import { imagensCursos } from '../assets/cursos';
import { Presentation, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Componente Lightbox aprimorado com navegação
const ImageLightbox = ({ currentIndex, images, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  // Efeito para adicionar navegação pelo teclado (setas <- e ->)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrev, onClose]);


  const image = images[currentImageIndex];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      {/* Botão de Fechar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-200 transition z-50"
      >
        <X size={24} />
      </button>

      {/* Botão de Navegação: Anterior */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            goToPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 text-white rounded-full p-2 hover:bg-white/50 transition"
      >
        <ChevronLeft size={32} />
      </button>

      {/* Container da Imagem */}
      <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
        <img src={image.src} alt={image.alt} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
      </div>

      {/* Botão de Navegação: Próximo */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 text-white rounded-full p-2 hover:bg-white/50 transition"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
};


function CursosPage() {
  const [lightboxData, setLightboxData] = useState({ isOpen: false, index: 0 });

  const settings = {
    dots: true,
    fade: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
  };

  const openLightbox = (imageIndex) => {
    setLightboxData({ isOpen: true, index: imageIndex });
  };

  const closeLightbox = () => {
    setLightboxData({ isOpen: false, index: 0 });
  };

  return (
    <>
      <div className="bg-gray-50 min-h-full p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Presentation className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Cursos e Ementas</h1>
            <p className="text-gray-600 mt-2">Navegue pelas nossas principais formações.</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-xl border">
            <Slider {...settings}>
              {imagensCursos.map((imagem, index) => (
                <div key={imagem.id} onClick={() => openLightbox(index)} className="cursor-zoom-in">
                  <div className="flex justify-center items-center h-[500px] bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={imagem.src} 
                      alt={imagem.alt}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>

      {/* Renderiza o Lightbox se estiver aberto */}
      {lightboxData.isOpen && (
        <ImageLightbox 
          currentIndex={lightboxData.index}
          images={imagensCursos}
          onClose={closeLightbox} 
        />
      )}
    </>
  );
}

export default CursosPage;
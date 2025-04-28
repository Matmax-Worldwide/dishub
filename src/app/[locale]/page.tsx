import { getDictionary, Locale, locales } from '../i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  return (
    <div className="bg-gray-100">
      <main>
        {/* Hero section */}
        <div className="relative overflow-hidden bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="relative z-10 bg-white pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
              <svg
                className="absolute inset-y-0 right-0 hidden h-full w-48 translate-x-1/2 transform text-white lg:block"
                fill="currentColor"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon points="50,0 100,0 50,100 0,100" />
              </svg>

              <div className="relative px-4 pt-6 sm:px-6 lg:px-8">
                <nav className="flex items-center justify-between sm:h-10" aria-label="Global">
                  <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
                    <div className="flex w-full items-center justify-between md:w-auto">
                      <a href="#" className="flex">
                        <span className="sr-only">Evoque</span>
                        <img
                          alt="Evoque"
                          className="h-8 w-auto sm:h-10"
                          src="/evoque.png"
                        />
                      </a>
                    </div>
                  </div>
                </nav>
              </div>

              <div className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">{dict.hero.title}</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                    {dict.hero.subtitle}
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <a
                        href="#"
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-purple-700 px-8 py-3 text-base font-medium text-white hover:bg-purple-800 md:py-4 md:px-10 md:text-lg"
                      >
                        {dict.hero.cta}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:h-full lg:w-full"
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
              alt=""
            />
          </div>
        </div>

        {/* Debug section */}
        <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Prueba de imágenes:</h2>
            <div className="flex space-x-4 items-center">
              <div>
                <p className="text-sm text-gray-500 mb-2">Imagen desde public:</p>
                <img 
                  src="/logo.png" 
                  alt="Logo desde public" 
                  className="h-16 w-auto" 
                />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Imagen desde public (URL relativa):</p>
                <img 
                  src="/logo.png" 
                  alt="Logo desde public" 
                  className="h-16 w-auto" 
                />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Imagen desde public (URL absoluta):</p>
                <img 
                  src="http://localhost:3000/logo.png" 
                  alt="Logo desde public (absoluta)" 
                  className="h-16 w-auto" 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
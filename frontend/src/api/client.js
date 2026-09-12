// Cliente HTTP centralizado para interactuar con el backend de IED La Victoria

const BASE_URL = '/api';

function getHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }

  return response;
}

export const api = {
  // Autenticación
  login: async (usuario, contrasena) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Excusas
  getExcusas: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const url = `${BASE_URL}/excusas?${params.toString()}`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getExcusaDetalle: async (id) => {
    const res = await fetch(`${BASE_URL}/excusas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  crearExcusa: async (formData) => {
    const res = await fetch(`${BASE_URL}/excusas`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },

  cerrarExcusaIndefinida: async (id, formData) => {
    const res = await fetch(`${BASE_URL}/excusas/${id}/cerrar`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },

  getTimelineEstudiante: async (idEstudiante) => {
    const res = await fetch(`${BASE_URL}/excusas/timeline/${idEstudiante}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Seguimiento institucional (HU-06)
  registrarSeguimiento: async (idExcusa, observacion) => {
    const res = await fetch(`${BASE_URL}/excusas/${idExcusa}/seguimiento`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ observacion })
    });
    return handleResponse(res);
  },

  getSeguimientos: async (idExcusa) => {
    const res = await fetch(`${BASE_URL}/excusas/${idExcusa}/seguimiento`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Catálogos
  getCursos: async () => {
    const res = await fetch(`${BASE_URL}/catalogos/cursos`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getMotivos: async () => {
    const res = await fetch(`${BASE_URL}/catalogos/motivos`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getVigencia: async () => {
    const res = await fetch(`${BASE_URL}/catalogos/vigencia`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getEstudiantes: async (busqueda = '', idCurso = '') => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (idCurso) params.append('id_curso', idCurso);
    const res = await fetch(`${BASE_URL}/catalogos/estudiantes?${params.toString()}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // HU-03 y HU-09: Descarga de archivo anexo
  descargarAnexo: async (idAnexo, nombreOriginal) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/anexos/${idAnexo}/descargar`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 403) {
      const data = await res.json();
      throw new Error(data.message || 'Acceso restringido: Este anexo solo puede ser descargado por Coordinación.');
    }

    if (!res.ok) {
      throw new Error('No se pudo descargar el archivo.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreOriginal || 'anexo';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // HU-07: Exportar CSV para Coordinador
  exportarCsv: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });

    const res = await fetch(`${BASE_URL}/reportes/excusas/csv?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 403) {
      throw new Error('Acceso denegado: Únicamente el rol de Coordinación puede exportar reportes.');
    }

    if (!res.ok) {
      throw new Error('Error al generar el reporte consolidado.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `reporte_excusas_ied_lavictoria_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

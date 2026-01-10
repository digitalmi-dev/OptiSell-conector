import { useState } from 'react';
import {
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiImage,
  FiX,
  FiSave,
  FiTrash2,
  FiCopy
} from 'react-icons/fi';

function ProductForm({ product, onSave, onCancel }) {
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState({
    // Informații de bază
    name: product?.name || '',
    sku: product?.sku || '',
    ean: product?.ean || '',
    asin: product?.asin || '',
    category: product?.category || '',
    brand: product?.brand || '',
    tags: product?.tags || '',
    
    // Preț și Stoc
    price: product?.price || '',
    comparePrice: product?.comparePrice || '',
    cost: product?.cost || '',
    taxRate: product?.taxRate || '21',
    priceIncludesTax: product?.priceIncludesTax || true,
    stock: product?.stock || 0,
    stockMin: product?.stockMin || 0,
    stockStatus: product?.stockStatus || 'in_stock',
    
    // Descriere
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    
    // Media
    images: product?.images || [],
    
    // Atribute
    attributes: product?.attributes || [],
    
    // Dimensiuni și greutate
    weight: product?.weight || '',
    length: product?.length || '',
    width: product?.width || '',
    height: product?.height || '',
    
    // Status
    active: product?.active !== undefined ? product.active : true,
  });

  const [eanFields, setEanFields] = useState([{ id: 1, value: formData.ean || '' }]);
  const [images, setImages] = useState(formData.images || []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const addEanField = () => {
    setEanFields([...eanFields, { id: Date.now(), value: '' }]);
  };

  const removeEanField = (id) => {
    setEanFields(eanFields.filter(f => f.id !== id));
  };

  const handleImageUpload = (e) => {
    // TODO: Implementare upload imagini
    const files = Array.from(e.target.files);
    setImages([...images, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const eans = eanFields.filter(f => f.value).map(f => f.value);
    const productData = {
      ...formData,
      ean: eans[0] || '',
      eans: eans,
      images: images
    };
    onSave(productData);
  };

  const SectionHeader = ({ id, title, description, icon: Icon }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {activeSection === id ? (
        <FiChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <FiChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Informații de Bază */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          id="basic"
          title="Informații de Bază"
          description="Nume, coduri identificare, categorie"
          icon={null}
        />
        {activeSection === 'basic' && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Numele produsului <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Introdu numele produsului"
                required
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="SKU-ul produsului"
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ASIN
                </label>
                <input
                  type="text"
                  value={formData.asin}
                  onChange={(e) => updateField('asin', e.target.value)}
                  placeholder="ASIN (pentru Amazon)"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                EAN / Cod de bare
              </label>
              {eanFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-1.5 mb-1.5">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      const newFields = [...eanFields];
                      newFields[index].value = e.target.value;
                      setEanFields(newFields);
                      if (index === 0) updateField('ean', e.target.value);
                    }}
                    placeholder="EAN / Cod de bare"
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {eanFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEanField(field.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEanField}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-1"
              >
                <FiPlus className="w-3.5 h-3.5" />
                <span>Adaugă alt EAN</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Categorie
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="Selectează categoria"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Brand / Producător
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Brand-ul produsului"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Etichete (Tags)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="Etichete separate prin virgulă"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preț și Stoc */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          id="pricing"
          title="Preț și Stoc"
          description="Prețuri, TVA, stoc disponibil"
          icon={null}
        />
        {activeSection === 'pricing' && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Preț <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    placeholder="0.00"
                    required
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-600">RON</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Preț redus
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => updateField('comparePrice', e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-600">RON</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cost achiziție
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => updateField('cost', e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-600">RON</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cota TVA
                </label>
                <select
                  value={formData.taxRate}
                  onChange={(e) => updateField('taxRate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="9">9%</option>
                  <option value="19">19%</option>
                  <option value="21">21%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stoc disponibil
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stoc minim
                </label>
                <input
                  type="number"
                  value={formData.stockMin}
                  onChange={(e) => updateField('stockMin', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="priceIncludesTax"
                checked={formData.priceIncludesTax}
                onChange={(e) => updateField('priceIncludesTax', e.target.checked)}
                className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="priceIncludesTax" className="text-xs text-gray-700">
                Prețul include TVA
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status stoc
              </label>
              <select
                value={formData.stockStatus}
                onChange={(e) => updateField('stockStatus', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="in_stock">În stoc</option>
                <option value="out_of_stock">Stoc epuizat</option>
                <option value="on_backorder">La comandă</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Descriere */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          id="description"
          title="Descriere"
          description="Descriere detaliată și scurtă"
          icon={null}
        />
        {activeSection === 'description' && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descriere scurtă
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                placeholder="Descriere scurtă a produsului (maximum 200 caractere)"
                rows="3"
                maxLength={200}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/200 caractere
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descriere detaliată
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descriere detaliată a produsului"
                rows="4"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Imagini */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          id="images"
          title="Imagini"
          description="Fotografii produs"
          icon={FiImage}
        />
        {activeSection === 'images' && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Încarcă imagini
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                <FiImage className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-600 mb-1.5">
                  Drag & drop imagini aici sau click pentru a selecta
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 cursor-pointer transition-colors text-xs"
                >
                  Selectează imagini
                </label>
                <p className="text-xs text-gray-500 mt-1.5">
                  Formate acceptate: JPG, PNG, GIF, WEBP. Dimensiune maximă: 4MB
                </p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview || img.url}
                      alt={`Produs ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                    />
                    {index === 0 && (
                      <span className="absolute top-0.5 left-0.5 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                        Principală
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dimensiuni și Greutate */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          id="dimensions"
          title="Dimensiuni și Greutate"
          description="Pentru calculare transport"
          icon={null}
        />
        {activeSection === 'dimensions' && (
          <div className="p-3 space-y-3 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Greutate (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lungime (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.length}
                  onChange={(e) => updateField('length', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Lățime (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.width}
                  onChange={(e) => updateField('width', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Înălțime (cm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => updateField('active', e.target.checked)}
          className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="active" className="text-xs font-medium text-gray-700">
          Produs activ (vizibil în integrări)
        </label>
      </div>

      {/* Butoane acțiune */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          {product && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Ești sigur că vrei să ștergi acest produs?')) {
                    // Va fi apelat onSave cu un flag special pentru ștergere
                    onSave({ ...productData, _delete: true });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Șterge</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vrei să duplici acest produs?')) {
                    const duplicatedData = {
                      ...formData,
                      name: `${formData.name || 'Produs'} (Copie)`,
                      sku: formData.sku ? `${formData.sku}-COPY-${Date.now()}` : `SKU-${Date.now()}`,
                      id: null // Va fi generat nou în pagină
                    };
                    onSave(duplicatedData);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <FiCopy className="w-3.5 h-3.5" />
                <span>Duplică</span>
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Anulează
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{product ? 'Salvează' : 'Creează'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default ProductForm;
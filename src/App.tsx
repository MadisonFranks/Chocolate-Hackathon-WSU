import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import './App.css'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

import saltedCaramel from './assets/Chocolates/salted-caramel.jpg'
import cookiesCream from './assets/Chocolates/cookies-cream.jpg'
import pistachio from './assets/Chocolates/pistachio.jpg'
import champagne from './assets/Chocolates/champagne.jpg'
import cheesecake from './assets/Chocolates/cheesecake.jpg'
import raspberry from './assets/Chocolates/raspberry.jpg'
import espressoMartini from './assets/Chocolates/espresso-martini.jpg'
import lemon from './assets/Chocolates/lemon.jpg'
import cremeBrulee from './assets/Chocolates/creme-brulee.jpg'

type Chocolate = {
  id: string
  name: string
  image: string
  isLogo?: boolean
}

type BoxDesign = {
  id: string
  name: string
  boxSize: number
  quantity: number
  boxContents: (Chocolate | null)[]
  ribbon: string
  giftBand: string
  customBandColor: string
  giftCard: string
  cardMessage: string
}

const chocolates: Chocolate[] = [
  {
    id: 'salted-caramel',
    name: 'Salted Caramel',
    image: saltedCaramel,
  },
  {
    id: 'cookies-cream',
    name: 'Cookies & Cream',
    image: cookiesCream,
  },
  {
    id: 'pistachio',
    name: 'Pistachio',
    image: pistachio,
  },
  {
    id: 'champagne',
    name: 'Champagne',
    image: champagne,
  },
  {
    id: 'cheesecake',
    name: 'Cheesecake',
    image: cheesecake,
  },
  {
    id: 'raspberry',
    name: 'Raspberry',
    image: raspberry,
  },
  {
    id: 'espresso-martini',
    name: 'Espresso Martini',
    image: espressoMartini,
  },
  {
    id: 'lemon',
    name: 'Lemon',
    image: lemon,
  },
  {
    id: 'creme-brulee',
    name: 'Crème Brulée',
    image: cremeBrulee,
  },
]

const boxSizes = [6, 10, 16, 30, 50]

let designCounter = 1

const makeDesignId = () => {
  designCounter += 1
  return `design-${Date.now()}-${designCounter}`
}

const createDesign = (number: number): BoxDesign => ({
  id: makeDesignId(),
  name: `Box Design ${number}`,
  boxSize: 6,
  quantity: 1,
  boxContents: Array(6).fill(null),
  ribbon: 'Gold',
  giftBand: 'None',
  customBandColor: '#7c3aed',
  giftCard: 'None',
  cardMessage: '',
})

function App() {
  const initialDesignRef = useRef<BoxDesign>(createDesign(1))

  const [designs, setDesigns] = useState<BoxDesign[]>([
    initialDesignRef.current,
  ])

  const [activeDesignId, setActiveDesignId] = useState(
    initialDesignRef.current.id
  )

  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [boxMessage, setBoxMessage] = useState('')
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const proofRef = useRef<HTMLDivElement | null>(null)

  const activeDesign =
    designs.find((design) => design.id === activeDesignId) ?? designs[0]

  if (!activeDesign) {
    return null
  }

  const updateActiveDesign = (updates: Partial<BoxDesign>) => {
    setDesigns((current) =>
      current.map((design) =>
        design.id === activeDesignId
          ? { ...design, ...updates }
          : design
      )
    )
  }

  const totalBoxes = designs.reduce(
    (total, design) => total + design.quantity,
    0
  )

  const totalChocolatePieces = designs.reduce(
    (total, design) => total + design.boxSize * design.quantity,
    0
  )

  const filledPositions = activeDesign.boxContents.filter(Boolean).length
  const emptyPositions = activeDesign.boxSize - filledPositions
  const isBoxComplete = emptyPositions === 0

  const currentDesignPieces =
    activeDesign.boxSize * activeDesign.quantity

  const getFlavorCounts = (design: BoxDesign) => {
    return design.boxContents.reduce<Record<string, number>>(
      (counts, chocolate) => {
        if (!chocolate) return counts

        counts[chocolate.name] =
          (counts[chocolate.name] ?? 0) + 1

        return counts
      },
      {}
    )
  }

  const activeFlavorCounts = getFlavorCounts(activeDesign)

  const orderFlavorCounts = designs.reduce<Record<string, number>>(
    (totals, design) => {
      const counts = getFlavorCounts(design)

      Object.entries(counts).forEach(([name, count]) => {
        totals[name] =
          (totals[name] ?? 0) + count * design.quantity
      })

      return totals
    },
    {}
  )

  const incompleteDesigns = designs.filter(
    (design) =>
      design.boxContents.filter(Boolean).length !== design.boxSize
  )

  const orderIsProductionReady = incompleteDesigns.length === 0

  const addDesign = () => {
    const newDesign = createDesign(designs.length + 1)

    setDesigns((current) => [...current, newDesign])
    setActiveDesignId(newDesign.id)
    setBoxMessage('New box design added.')
  }

  const duplicateDesign = () => {
    const duplicate: BoxDesign = {
      ...activeDesign,
      id: makeDesignId(),
      name: `${activeDesign.name} Copy`,
      boxContents: activeDesign.boxContents.map((chocolate) =>
        chocolate ? { ...chocolate } : null
      ),
    }

    setDesigns((current) => [...current, duplicate])
    setActiveDesignId(duplicate.id)
    setBoxMessage('Box design duplicated.')
  }

  const deleteDesign = () => {
    if (designs.length === 1) {
      alert('Your order must contain at least one box design.')
      return
    }

    const currentIndex = designs.findIndex(
      (design) => design.id === activeDesignId
    )

    const remaining = designs.filter(
      (design) => design.id !== activeDesignId
    )

    const nextIndex = Math.max(0, currentIndex - 1)

    setDesigns(remaining)
    setActiveDesignId(remaining[nextIndex].id)
    setBoxMessage('Box design deleted.')
  }

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    chocolate: Chocolate
  ) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify(chocolate)
    )

    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault()

    const data = event.dataTransfer.getData('application/json')

    if (!data) return

    const chocolate: Chocolate = JSON.parse(data)
    const newContents = [...activeDesign.boxContents]

    newContents[index] = chocolate

    updateActiveDesign({
      boxContents: newContents,
    })

    setBoxMessage('')
  }

  const removeChocolate = (index: number) => {
    const newContents = [...activeDesign.boxContents]
    newContents[index] = null

    updateActiveDesign({
      boxContents: newContents,
    })

    setBoxMessage('')
  }

  const autoFillBox = () => {
    let flavorIndex = 0

    const newContents = activeDesign.boxContents.map((item) => {
      if (item) return item

      const chocolate =
        chocolates[flavorIndex % chocolates.length]

      flavorIndex += 1
      return chocolate
    })

    updateActiveDesign({
      boxContents: newContents,
    })

    setBoxMessage(
      '✓ Box automatically filled. You can still change individual pieces.'
    )
  }

  const clearBox = () => {
    updateActiveDesign({
      boxContents: Array(activeDesign.boxSize).fill(null),
    })

    setBoxMessage(
      'Box cleared. Your packaging selections were kept.'
    )
  }

  const changeBoxSize = (size: number) => {
    updateActiveDesign({
      boxSize: size,
      boxContents: Array(size).fill(null),
    })

    setBoxMessage(
      `Box changed to ${size} pieces. Choose chocolates for the new layout.`
    )
  }

  const changeQuantity = (quantity: number) => {
    const safeQuantity = Math.max(
      1,
      Math.min(1000000, Math.floor(quantity || 1))
    )

    updateActiveDesign({
      quantity: safeQuantity,
    })
  }

  const handleLogoUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompanyLogo(reader.result)
      }
    }

    reader.readAsDataURL(file)
  }

  const logoChocolate: Chocolate = {
    id: 'corporate-logo',
    name: 'Logo Chocolate',
    image: '',
    isLogo: true,
  }

  const ribbonClass = (ribbon: string) =>
    `proof-ribbon-${ribbon.toLowerCase().replace(/\s+/g, '-')}`

  const giftBandClass = (band: string) =>
    `proof-band-${band.toLowerCase().replace(/\s+/g, '-')}`

  const exportSpec = () => {
    if (!orderIsProductionReady) {
      alert(
        `${incompleteDesigns.length} box design${
          incompleteDesigns.length === 1 ? ' is' : 's are'
        } incomplete.\n\nFill every chocolate position before exporting the production specification.`
      )
      return
    }

    const specification = {
      specificationVersion: '3.0',
      product: 'Cocoa Dolce Corporate Chocolate Order',
      productionStatus: 'Ready for Production',

      order: {
        totalBoxDesigns: designs.length,
        totalBoxes,
        totalChocolatePieces,
      },

      entireOrderFlavorRequirements: orderFlavorCounts,

      boxDesigns: designs.map((design, designIndex) => {
        const flavorCounts = getFlavorCounts(design)

        const logoPositions = design.boxContents
          .map((chocolate, index) =>
            chocolate?.isLogo ? index + 1 : null
          )
          .filter(
            (position): position is number => position !== null
          )

        return {
          designNumber: designIndex + 1,
          designName: design.name,

          box: {
            size: design.boxSize,
            quantity: design.quantity,
            totalPieces: design.boxSize * design.quantity,
            filledPositions:
              design.boxContents.filter(Boolean).length,
            emptyPositions:
              design.boxSize -
              design.boxContents.filter(Boolean).length,
          },

          packaging: {
            ribbon: design.ribbon,
            giftBand: design.giftBand,
            customBandColor:
              design.giftBand === 'Custom Brand Color'
                ? design.customBandColor.toUpperCase()
                : null,
          },

          giftCard: {
            type: design.giftCard,
            message: design.cardMessage,
          },

          corporateBranding: {
            companyLogoIncluded: companyLogo !== null,
            logoChocolatePositions: logoPositions,
            logoChocolatesPerBox: logoPositions.length,
            totalLogoChocolates:
              logoPositions.length * design.quantity,
          },

          flavorSummaryPerBox: flavorCounts,

          flavorSummaryEntireDesign: Object.fromEntries(
            Object.entries(flavorCounts).map(([name, count]) => [
              name,
              count * design.quantity,
            ])
          ),

          chocolatesPerBox: design.boxContents.map(
            (chocolate, index) => ({
              position: index + 1,
              id: chocolate?.id ?? null,
              name: chocolate?.name ?? null,
              type: chocolate?.isLogo
                ? 'Corporate Logo Chocolate'
                : chocolate
                  ? 'Chocolate'
                  : 'Empty',
            })
          ),
        }
      }),

      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob(
      [JSON.stringify(specification, null, 2)],
      {
        type: 'application/json',
      }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]

    link.href = url
    link.download =
      `cocoa-dolce-${totalBoxes}-boxes-${totalChocolatePieces}-pieces-${date}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const downloadClientProofPdf = async () => {
    if (!proofRef.current) return

    try {
      setIsDownloadingPdf(true)

      await new Promise((resolve) => setTimeout(resolve, 150))

      const canvas = await html2canvas(proofRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fffdf9',
        logging: false,
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2

      const pixelsPerMm = canvas.width / usableWidth
      const sliceHeight = Math.floor(
        usableHeight * pixelsPerMm
      )

      let sourceY = 0
      let pageNumber = 0

      while (sourceY < canvas.height) {
        const currentSliceHeight = Math.min(
          sliceHeight,
          canvas.height - sourceY
        )

        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = currentSliceHeight

        const context = pageCanvas.getContext('2d')

        if (!context) {
          throw new Error('Unable to create PDF canvas.')
        }

        context.fillStyle = '#fffdf9'
        context.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        )

        context.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight
        )

        const imageData = pageCanvas.toDataURL(
          'image/jpeg',
          0.94
        )

        const displayedHeight =
          currentSliceHeight / pixelsPerMm

        if (pageNumber > 0) {
          pdf.addPage()
        }

        pdf.addImage(
          imageData,
          'JPEG',
          margin,
          margin,
          usableWidth,
          displayedHeight,
          undefined,
          'FAST'
        )

        sourceY += currentSliceHeight
        pageNumber += 1
      }

      const date = new Date().toISOString().split('T')[0]

      pdf.save(
        `cocoa-dolce-${totalBoxes}-box-corporate-order-${date}.pdf`
      )
    } catch (error) {
      console.error(error)
      alert('The PDF could not be created. Please try again.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const renderChocolate = (chocolate: Chocolate) => {
    if (chocolate.isLogo) {
      return (
        <div className="branded-chocolate">
          <div className="branded-chocolate-top">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company logo"
                className="branded-chocolate-logo"
              />
            ) : (
              <span className="branded-chocolate-text">
                LOGO
              </span>
            )}
          </div>
        </div>
      )
    }

    return (
      <img
        src={chocolate.image}
        alt={chocolate.name}
        className="placed-product-image"
      />
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="brand">COCOA DOLCE</p>
          <h1>Corporate Box Designer</h1>
        </div>

        <div className="header-buttons">
          <button
            className="secondary-button"
            onClick={() => setShowPreview(true)}
          >
            Preview Order
          </button>

          <button
            className="primary-button"
            onClick={exportSpec}
          >
            Export Production Spec
          </button>
        </div>
      </header>

      <section className="order-workspace">
        <div className="order-top-row">
          <div>
            <p className="eyebrow">YOUR CORPORATE ORDER</p>
            <h2>Box Designs</h2>
          </div>

          <button
            className="add-design-button"
            onClick={addDesign}
          >
            + Add Another Box Design
          </button>
        </div>

        <div className="design-tabs">
          {designs.map((design, index) => {
            const filled =
              design.boxContents.filter(Boolean).length

            const complete = filled === design.boxSize

            return (
              <button
                key={design.id}
                className={`design-tab ${
                  design.id === activeDesignId
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  setActiveDesignId(design.id)
                  setBoxMessage('')
                }}
              >
                <span className="tab-number">
                  DESIGN {index + 1}
                </span>

                <strong>{design.name}</strong>

                <span>
                  {design.boxSize} Piece · Qty{' '}
                  {design.quantity.toLocaleString()}
                </span>

                <span
                  className={
                    complete
                      ? 'complete-text'
                      : 'incomplete-text'
                  }
                >
                  {complete
                    ? '✓ Complete'
                    : `${filled}/${design.boxSize} Filled`}
                </span>
              </button>
            )
          })}
        </div>

        <div className="order-totals">
          <div>
            <span>Box Designs</span>
            <strong>{designs.length}</strong>
          </div>

          <div>
            <span>Total Boxes</span>
            <strong>{totalBoxes.toLocaleString()}</strong>
          </div>

          <div>
            <span>Total Chocolates</span>
            <strong>
              {totalChocolatePieces.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>Production</span>
            <strong>
              {orderIsProductionReady
                ? '✓ Ready'
                : `${incompleteDesigns.length} Incomplete`}
            </strong>
          </div>
        </div>
      </section>

      <main className="builder">
        <section className="panel chocolate-panel">
          <h2>Chocolates</h2>

          <p className="description">
            Drag chocolates into the current box.
          </p>

          <p className="section-label">
            CORPORATE CHOCOLATE
          </p>

          <button
            className="logo-chocolate-card"
            draggable
            onDragStart={(event) =>
              handleDragStart(event, logoChocolate)
            }
          >
            <div className="logo-chocolate-preview">
              {companyLogo ? (
                <img src={companyLogo} alt="Company logo" />
              ) : (
                <span>LOGO</span>
              )}
            </div>

            <div>
              <strong>Logo Chocolate</strong>
              <p>Custom branded piece</p>
            </div>
          </button>

          <p className="section-label">FLAVORS</p>

          <div className="chocolate-grid">
            {chocolates.map((chocolate) => (
              <button
                key={chocolate.id}
                className="chocolate-card"
                draggable
                onDragStart={(event) =>
                  handleDragStart(event, chocolate)
                }
              >
                <img
                  src={chocolate.image}
                  alt={chocolate.name}
                />

                <span>{chocolate.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="designer-area">
          <p className="eyebrow">CURRENT BOX DESIGN</p>

          <input
            className="design-name-input"
            value={activeDesign.name}
            maxLength={50}
            onChange={(event) =>
              updateActiveDesign({
                name: event.target.value,
              })
            }
          />

          <p className="design-calculation">
            {activeDesign.quantity.toLocaleString()} box
            {activeDesign.quantity === 1 ? '' : 'es'} ×{' '}
            {activeDesign.boxSize} pieces ={' '}
            <strong>
              {currentDesignPieces.toLocaleString()}
            </strong>{' '}
            chocolates
          </p>

          <div className="box-stage">
            <div
              className={`chocolate-box box-${activeDesign.boxSize}`}
            >
              {activeDesign.boxContents.map(
                (chocolate, index) => (
                  <div
                    key={index}
                    className={`box-slot ${
                      chocolate ? 'filled-slot' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(event) =>
                      handleDrop(event, index)
                    }
                    onClick={() => {
                      if (chocolate) {
                        removeChocolate(index)
                      }
                    }}
                    title={
                      chocolate
                        ? `${chocolate.name} — click to remove`
                        : `Position ${index + 1}`
                    }
                  >
                    {chocolate ? (
                      renderChocolate(chocolate)
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="box-buttons">
            <button
              className="auto-fill-button"
              onClick={autoFillBox}
              disabled={isBoxComplete}
            >
              ✦ Auto Fill Box
            </button>

            <button
              className="clear-button"
              onClick={clearBox}
              disabled={filledPositions === 0}
            >
              Clear Box
            </button>
          </div>

          {boxMessage && (
            <div className="box-message">{boxMessage}</div>
          )}

          <div
            className={`design-status ${
              isBoxComplete ? 'ready' : ''
            }`}
          >
            {isBoxComplete
              ? `✓ Design Ready — ${currentDesignPieces.toLocaleString()} pieces for this design`
              : `${filledPositions} of ${activeDesign.boxSize} positions filled — ${emptyPositions} remaining`}
          </div>

          <section className="flavor-summary">
            <div className="summary-heading">
              <div>
                <p className="eyebrow">CURRENT DESIGN</p>
                <h3>Flavor Summary</h3>
              </div>

              <strong>
                {filledPositions}/{activeDesign.boxSize}
              </strong>
            </div>

            {Object.keys(activeFlavorCounts).length === 0 ? (
              <div className="empty-summary">
                Your box is empty. Drag chocolates into the
                box or use Auto Fill.
              </div>
            ) : (
              <div className="summary-list">
                {Object.entries(activeFlavorCounts).map(
                  ([name, count]) => (
                    <div key={name}>
                      <span>{name}</span>
                      <strong>× {count} per box</strong>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </section>

        <section className="panel customize-panel">
          <h2>Customize</h2>

          <label>Box Size</label>

          <select
            value={activeDesign.boxSize}
            onChange={(event) =>
              changeBoxSize(Number(event.target.value))
            }
          >
            {boxSizes.map((size) => (
              <option key={size} value={size}>
                {size} Piece
              </option>
            ))}
          </select>

          <label>Quantity of This Design</label>

          <div className="quantity-control">
            <button
              onClick={() =>
                changeQuantity(activeDesign.quantity - 1)
              }
            >
              −
            </button>

            <input
              type="number"
              min="1"
              max="1000000"
              value={activeDesign.quantity}
              onChange={(event) =>
                changeQuantity(Number(event.target.value))
              }
            />

            <button
              onClick={() =>
                changeQuantity(activeDesign.quantity + 1)
              }
            >
              +
            </button>
          </div>

          <div className="quantity-summary">
            <div>
              <span>Boxes</span>
              <strong>
                {activeDesign.quantity.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Pieces / Box</span>
              <strong>{activeDesign.boxSize}</strong>
            </div>

            <div>
              <span>Total Pieces</span>
              <strong>
                {currentDesignPieces.toLocaleString()}
              </strong>
            </div>
          </div>

          <label>Ribbon</label>

          <select
            value={activeDesign.ribbon}
            onChange={(event) =>
              updateActiveDesign({
                ribbon: event.target.value,
              })
            }
          >
            <option>Gold</option>
            <option>Black</option>
            <option>White</option>
            <option>Navy</option>
            <option>None</option>
          </select>

          <label>Gift Band</label>

          <select
            value={activeDesign.giftBand}
            onChange={(event) =>
              updateActiveDesign({
                giftBand: event.target.value,
              })
            }
          >
            <option>None</option>
            <option>Gold</option>
            <option>Black</option>
            <option>White</option>
            <option>Custom Brand Color</option>
          </select>

          {activeDesign.giftBand ===
            'Custom Brand Color' && (
            <div className="color-control">
              <input
                type="color"
                value={activeDesign.customBandColor}
                onChange={(event) =>
                  updateActiveDesign({
                    customBandColor: event.target.value,
                  })
                }
              />

              <strong>
                {activeDesign.customBandColor.toUpperCase()}
              </strong>
            </div>
          )}

          <label>Gift Card</label>

          <select
            value={activeDesign.giftCard}
            onChange={(event) =>
              updateActiveDesign({
                giftCard: event.target.value,
              })
            }
          >
            <option>None</option>
            <option>Thank You</option>
            <option>Congratulations</option>
            <option>Custom Message</option>
          </select>

          {activeDesign.giftCard !== 'None' && (
            <textarea
              className="card-message"
              maxLength={200}
              value={activeDesign.cardMessage}
              placeholder="Enter your gift card message..."
              onChange={(event) =>
                updateActiveDesign({
                  cardMessage: event.target.value,
                })
              }
            />
          )}

          <label>Company Logo</label>

          {!companyLogo ? (
            <label className="upload-button">
              + Upload Company Logo

              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </label>
          ) : (
            <div className="logo-uploaded">
              <img src={companyLogo} alt="Uploaded company logo" />

              <span>✓ Logo Uploaded</span>

              <button onClick={() => setCompanyLogo(null)}>
                Remove Logo
              </button>
            </div>
          )}

          <div className="design-actions">
            <button
              className="duplicate-button"
              onClick={duplicateDesign}
            >
              Duplicate This Design
            </button>

            <button
              className="delete-button"
              onClick={deleteDesign}
              disabled={designs.length === 1}
            >
              Delete This Design
            </button>
          </div>
        </section>
      </main>

      {showPreview && (
        <div
          className="preview-overlay"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="preview-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="preview-close"
              onClick={() => setShowPreview(false)}
            >
              ×
            </button>

            <div ref={proofRef} className="pdf-proof">
              <div className="proof-header">
                <p className="brand">COCOA DOLCE</p>

                <h2>Corporate Order Client Proof</h2>

                <p>
                  {designs.length} design
                  {designs.length === 1 ? '' : 's'} ·{' '}
                  {totalBoxes.toLocaleString()} boxes ·{' '}
                  {totalChocolatePieces.toLocaleString()}{' '}
                  chocolates
                </p>
              </div>

              <div className="proof-order-totals">
                <div>
                  <span>Box Designs</span>
                  <strong>{designs.length}</strong>
                </div>

                <div>
                  <span>Total Boxes</span>
                  <strong>
                    {totalBoxes.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Total Pieces</span>
                  <strong>
                    {totalChocolatePieces.toLocaleString()}
                  </strong>
                </div>
              </div>

              {designs.map((design, designIndex) => {
                const counts = getFlavorCounts(design)
                const filled =
                  design.boxContents.filter(Boolean).length
                const complete = filled === design.boxSize
                const designTotal =
                  design.boxSize * design.quantity

                return (
                  <section
                    className="proof-design"
                    key={design.id}
                  >
                    <div className="proof-design-heading">
                      <div>
                        <p className="eyebrow">
                          BOX DESIGN {designIndex + 1}
                        </p>

                        <h3>{design.name}</h3>

                        <p>
                          {design.quantity.toLocaleString()} ×{' '}
                          {design.boxSize}-Piece Box ={' '}
                          {designTotal.toLocaleString()} pieces
                        </p>
                      </div>

                      <span
                        className={`proof-status ${
                          complete ? 'complete' : ''
                        }`}
                      >
                        {complete
                          ? '✓ Production Ready'
                          : `${filled}/${design.boxSize} Filled`}
                      </span>
                    </div>

                    <div className="proof-side-by-side">
                      <div className="proof-column">
                        <p className="proof-label">
                          FINISHED BOX
                        </p>

                        <div className="closed-stage">
                          <div className="closed-box">
                            <div className="closed-box-lid">
                              <div className="closed-brand">
                                COCOA DOLCE
                              </div>

                              {design.ribbon !== 'None' && (
                                <>
                                  <div
                                    className={`ribbon-vertical ${ribbonClass(
                                      design.ribbon
                                    )}`}
                                  />

                                  <div
                                    className={`ribbon-horizontal ${ribbonClass(
                                      design.ribbon
                                    )}`}
                                  />

                                  <div className="bow">
                                    <div
                                      className={`bow-left ${ribbonClass(
                                        design.ribbon
                                      )}`}
                                    />

                                    <div
                                      className={`bow-knot ${ribbonClass(
                                        design.ribbon
                                      )}`}
                                    />

                                    <div
                                      className={`bow-right ${ribbonClass(
                                        design.ribbon
                                      )}`}
                                    />
                                  </div>
                                </>
                              )}

                              {design.giftBand !== 'None' && (
                                <div
                                  className={`gift-band ${giftBandClass(
                                    design.giftBand
                                  )}`}
                                  style={
                                    design.giftBand ===
                                    'Custom Brand Color'
                                      ? {
                                          background:
                                            design.customBandColor,
                                        }
                                      : undefined
                                  }
                                >
                                  <div className="gift-band-label">
                                    {companyLogo ? (
                                      <img
                                        src={companyLogo}
                                        alt="Company logo"
                                      />
                                    ) : (
                                      <span>CORPORATE GIFT</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {companyLogo &&
                                design.giftBand === 'None' && (
                                  <div className="lid-logo">
                                    <img
                                      src={companyLogo}
                                      alt="Company logo"
                                    />
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        <p className="proof-caption">
                          Closed Box / Client Presentation
                        </p>
                      </div>

                      <div className="proof-column">
                        <p className="proof-label">
                          CHOCOLATE SELECTION
                        </p>

                        <div className="open-stage">
                          <div
                            className={`open-box open-${design.boxSize}`}
                          >
                            {design.boxContents.map(
                              (chocolate, index) => (
                                <div
                                  key={index}
                                  className={`open-slot ${
                                    chocolate ? 'has-chocolate' : ''
                                  }`}
                                >
                                  {chocolate ? (
                                    chocolate.isLogo ? (
                                      <div className="proof-logo-chocolate">
                                        {companyLogo ? (
                                          <img
                                            src={companyLogo}
                                            alt="Logo chocolate"
                                          />
                                        ) : (
                                          <span>LOGO</span>
                                        )}
                                      </div>
                                    ) : (
                                      <img
                                        src={chocolate.image}
                                        alt={chocolate.name}
                                      />
                                    )
                                  ) : (
                                    <span>{index + 1}</span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <p className="proof-caption">
                          Open Box / Exact Chocolate Placement
                        </p>
                      </div>
                    </div>

                    <div className="proof-details">
                      <div>
                        <span>Box Size</span>
                        <strong>{design.boxSize} Piece</strong>
                      </div>

                      <div>
                        <span>Quantity</span>
                        <strong>
                          {design.quantity.toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span>Total Pieces</span>
                        <strong>
                          {designTotal.toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <span>Ribbon</span>
                        <strong>{design.ribbon}</strong>
                      </div>

                      <div>
                        <span>Gift Band</span>
                        <strong>{design.giftBand}</strong>
                      </div>
                    </div>

                    <div className="proof-flavors">
                      <div className="proof-section-heading">
                        <div>
                          <p className="eyebrow">
                            FLAVOR REQUIREMENTS
                          </p>

                          <h4>Chocolate Selection</h4>
                        </div>

                        <strong>
                          {design.boxSize} per box
                        </strong>
                      </div>

                      <div className="proof-flavor-grid">
                        {Object.entries(counts).map(
                          ([name, count]) => (
                            <div key={name}>
                              <span>{name}</span>

                              <strong>
                                {count} / box ·{' '}
                                {(
                                  count * design.quantity
                                ).toLocaleString()}{' '}
                                total
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {design.giftCard !== 'None' && (
                      <div className="proof-gift-card">
                        <span>GIFT CARD</span>

                        <strong>{design.giftCard}</strong>

                        {design.cardMessage && (
                          <p>“{design.cardMessage}”</p>
                        )}
                      </div>
                    )}
                  </section>
                )
              })}

              <section className="production-summary">
                <p className="eyebrow">
                  ENTIRE CORPORATE ORDER
                </p>

                <h3>Production Requirements</h3>

                <div className="production-big-totals">
                  <div>
                    <span>Designs</span>
                    <strong>{designs.length}</strong>
                  </div>

                  <div>
                    <span>Total Boxes</span>
                    <strong>
                      {totalBoxes.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>Total Chocolates</span>
                    <strong>
                      {totalChocolatePieces.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <h4>Entire Order Flavor Totals</h4>

                <div className="proof-flavor-grid">
                  {Object.entries(orderFlavorCounts).map(
                    ([name, count]) => (
                      <div key={name}>
                        <span>{name}</span>
                        <strong>
                          {count.toLocaleString()} pieces
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </section>

              <div
                className={`final-production-status ${
                  orderIsProductionReady ? 'ready' : ''
                }`}
              >
                <div className="status-icon">
                  {orderIsProductionReady ? '✓' : '!'}
                </div>

                <div>
                  <strong>
                    {orderIsProductionReady
                      ? 'Entire Order Ready for Production'
                      : 'Order Not Yet Complete'}
                  </strong>

                  <p>
                    {orderIsProductionReady
                      ? `${totalBoxes.toLocaleString()} boxes and ${totalChocolatePieces.toLocaleString()} chocolate pieces are fully specified.`
                      : `${incompleteDesigns.length} box design${
                          incompleteDesigns.length === 1
                            ? ' needs'
                            : 's need'
                        } to be completed.`}
                  </p>
                </div>
              </div>

              <footer className="proof-footer">
                <span>COCOA DOLCE</span>
                <span>Corporate Gift Box Client Proof</span>
              </footer>
            </div>

            <div className="preview-actions">
              <button
                className="secondary-button"
                onClick={() => setShowPreview(false)}
              >
                Continue Editing
              </button>

              <button
                className="pdf-button"
                onClick={downloadClientProofPdf}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf
                  ? 'Creating PDF...'
                  : '↓ Download PDF'}
              </button>

              <button
                className="primary-button"
                onClick={exportSpec}
              >
                Export JSON Spec
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
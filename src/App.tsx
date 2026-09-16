import { useState } from 'react'
import './App.css'

type ChocolateType = 'milk' | 'dark' | 'caramel' | 'logo'

type Chocolate = {
  type: ChocolateType
  name: string
}

const chocolates: Chocolate[] = [
  {
    type: 'milk',
    name: 'Milk Chocolate',
  },
  {
    type: 'dark',
    name: 'Dark Chocolate',
  },
  {
    type: 'caramel',
    name: 'Caramel',
  },
  {
    type: 'logo',
    name: 'Logo Chocolate',
  },
]

function App() {
  // =========================================
  // STATE
  // =========================================

  const [boxSize, setBoxSize] = useState(12)

  const [boxContents, setBoxContents] = useState<
    (Chocolate | null)[]
  >(Array(12).fill(null))

  const [ribbon, setRibbon] = useState('Gold')

  const [giftBand, setGiftBand] = useState('None')

  const [giftCard, setGiftCard] = useState('None')

  const [cardMessage, setCardMessage] = useState('')

  const [companyLogo, setCompanyLogo] =
    useState<string | null>(null)

  // =========================================
  // DRAG AND DROP
  // =========================================

  const handleDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    chocolate: Chocolate
  ) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify(chocolate)
    )

    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault()

    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault()

    const chocolateData =
      event.dataTransfer.getData('application/json')

    if (!chocolateData) {
      return
    }

    const chocolate: Chocolate =
      JSON.parse(chocolateData)

    const newContents = [...boxContents]

    newContents[index] = chocolate

    setBoxContents(newContents)
  }

  // =========================================
  // REMOVE CHOCOLATE
  // =========================================

  const removeChocolate = (index: number) => {
    const newContents = [...boxContents]

    newContents[index] = null

    setBoxContents(newContents)
  }

  // =========================================
  // CHANGE BOX SIZE
  // =========================================

  const changeBoxSize = (size: number) => {
    setBoxSize(size)

    setBoxContents(
      Array(size).fill(null)
    )
  }

  // =========================================
  // COMPANY LOGO UPLOAD
  // =========================================

  const handleLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

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

  const removeLogo = () => {
    setCompanyLogo(null)
  }

  // =========================================
  // BOX INFORMATION
  // =========================================

  const filledPositions =
    boxContents.filter(
      (item) => item !== null
    ).length

  // Find all logo chocolate positions

  const logoPositions = boxContents
    .map((item, index) =>
      item?.type === 'logo'
        ? index + 1
        : null
    )
    .filter(
      (position): position is number =>
        position !== null
    )

  // Recommended center positions

  const recommendedLogoPositions =
    boxSize === 12
      ? [6, 7]
      : [9, 10, 15, 16]

  const hasLogoChocolate =
    logoPositions.length > 0

  const logosAreCorrectlyPlaced =
    hasLogoChocolate &&
    logoPositions.every((position) =>
      recommendedLogoPositions.includes(position)
    )

  // =========================================
  // APP
  // =========================================

  return (
    <div className="app">

      {/* =====================================
          HEADER
          ===================================== */}

      <header className="header">

        <div className="header-title">

          <p className="brand">
            COCOA DOLCE
          </p>

          <h1>
            Corporate Box Designer
          </h1>

        </div>

        <div className="header-buttons">

          <button
            type="button"
            className="secondary-button"
          >
            Preview
          </button>

          <button
            type="button"
            className="primary-button"
          >
            Export Spec
          </button>

        </div>

      </header>

      {/* =====================================
          MAIN BUILDER
          ===================================== */}

      <main className="builder">

        {/* ===================================
            LEFT PANEL
            =================================== */}

        <section className="panel chocolate-panel">

          <h2>
            Chocolates
          </h2>

          <p className="description">
            Drag chocolates into your
            corporate gift box.
          </p>

          <div className="chocolate-list">

            {chocolates.map((chocolate) => (

              <button
                type="button"
                key={chocolate.type}
                className="chocolate-option"
                draggable
                onDragStart={(event) =>
                  handleDragStart(
                    event,
                    chocolate
                  )
                }
              >

                <span
                  className={`chocolate ${
                    chocolate.type === 'logo'
                      ? 'logo-piece'
                      : chocolate.type
                  }`}
                >

                  {chocolate.type === 'logo' ? (

                    companyLogo ? (

                      <img
                        src={companyLogo}
                        alt="Company logo"
                        className="small-logo-image"
                      />

                    ) : (

                      'LOGO'

                    )

                  ) : null}

                </span>

                <span className="chocolate-name">
                  {chocolate.name}
                </span>

                <span className="drag-handle">
                  ⋮
                </span>

              </button>

            ))}

          </div>

          <div className="drag-tip">

            <strong>
              How to use
            </strong>

            <p>
              Drag a chocolate and drop it
              into any numbered position
              in the box.
            </p>

          </div>

        </section>

        {/* ===================================
            CENTER BOX
            =================================== */}

        <section className="box-area">

          <div className="box-heading">

            <p className="eyebrow">
              LIVE PREVIEW
            </p>

            <h2>
              Design Your Box
            </h2>

            <p>
              Drag chocolates into the
              positions below.
            </p>

          </div>

          <div
            className={
              boxSize === 24
                ? 'chocolate-box box-24'
                : 'chocolate-box'
            }
          >

            {boxContents.map(
              (chocolate, index) => (

                <div
                  key={index}
                  className={`box-slot ${
                    chocolate
                      ? 'filled-slot'
                      : ''
                  }`}
                  onDragOver={
                    handleDragOver
                  }
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      index
                    )
                  }
                  onClick={() => {
                    if (chocolate) {
                      removeChocolate(index)
                    }
                  }}
                >

                  {chocolate ? (

                    <div
                      className={`placed-chocolate ${
                        chocolate.type === 'logo'
                          ? 'placed-logo'
                          : chocolate.type
                      }`}
                    >

                      {chocolate.type === 'logo' ? (

                        companyLogo ? (

                          <img
                            src={companyLogo}
                            alt="Company logo"
                            className="placed-logo-image"
                          />

                        ) : (

                          'LOGO'

                        )

                      ) : null}

                    </div>

                  ) : (

                    <span className="slot-number">
                      {index + 1}
                    </span>

                  )}

                </div>

              )
            )}

          </div>

          <div className="status">
            ✓ {filledPositions} of {boxSize}{' '}
            positions filled
          </div>

          {filledPositions > 0 && (

            <p className="remove-tip">
              Click a chocolate in the box
              to remove it.
            </p>

          )}

        </section>

        {/* ===================================
            RIGHT PANEL
            =================================== */}

        <section className="panel customize-panel">

          <h2>
            Customize
          </h2>

          {/* BOX SIZE */}

          <label htmlFor="box-size">
            Box Size
          </label>

          <select
            id="box-size"
            value={boxSize}
            onChange={(event) =>
              changeBoxSize(
                Number(event.target.value)
              )
            }
          >

            <option value={12}>
              12 Piece
            </option>

            <option value={24}>
              24 Piece
            </option>

          </select>

          {/* RIBBON */}

          <label htmlFor="ribbon">
            Ribbon
          </label>

          <select
            id="ribbon"
            value={ribbon}
            onChange={(event) =>
              setRibbon(event.target.value)
            }
          >

            <option value="Gold">
              Gold
            </option>

            <option value="Black">
              Black
            </option>

            <option value="White">
              White
            </option>

            <option value="Navy">
              Navy
            </option>

          </select>

          {/* GIFT BAND */}

          <label htmlFor="gift-band">
            Gift Band
          </label>

          <select
            id="gift-band"
            value={giftBand}
            onChange={(event) =>
              setGiftBand(event.target.value)
            }
          >

            <option value="None">
              None
            </option>

            <option value="Gold">
              Gold
            </option>

            <option value="Black">
              Black
            </option>

            <option value="White">
              White
            </option>

            <option value="Custom Brand Color">
              Custom Brand Color
            </option>

          </select>

          {/* GIFT CARD */}

          <label htmlFor="gift-card">
            Gift Card
          </label>

          <select
            id="gift-card"
            value={giftCard}
            onChange={(event) => {

              const value =
                event.target.value

              setGiftCard(value)

              if (value === 'None') {
                setCardMessage('')
              }

            }}
          >

            <option value="None">
              None
            </option>

            <option value="Thank You">
              Thank You
            </option>

            <option value="Congratulations">
              Congratulations
            </option>

            <option value="Custom Message">
              Custom Message
            </option>

          </select>

          {/* CARD MESSAGE */}

          {giftCard !== 'None' && (

            <div className="card-message-section">

              <label htmlFor="card-message">
                Card Message
              </label>

              <textarea
                id="card-message"
                className="card-message"
                value={cardMessage}
                maxLength={200}
                placeholder="Enter a message for the recipient..."
                onChange={(event) =>
                  setCardMessage(
                    event.target.value
                  )
                }
              />

              <div className="character-count">
                {cardMessage.length} / 200 characters
              </div>

            </div>

          )}

          {/* COMPANY LOGO */}

          <label>
            Company Logo
          </label>

          {!companyLogo ? (

            <label
              className="
                upload-button
                logo-upload-label
              "
            >

              + Upload Logo

              <input
                type="file"
                accept="
                  image/png,
                  image/jpeg,
                  image/jpg,
                  image/webp
                "
                onChange={
                  handleLogoUpload
                }
                className="
                  hidden-file-input
                "
              />

            </label>

          ) : (

            <div className="uploaded-logo-card">

              <div className="uploaded-logo-preview">

                <img
                  src={companyLogo}
                  alt="Uploaded company logo"
                />

              </div>

              <div className="logo-upload-success">
                ✓ Logo uploaded
              </div>

              <div className="logo-actions">

                <label
                  className="
                    change-logo-button
                  "
                >

                  Change Logo

                  <input
                    type="file"
                    accept="
                      image/png,
                      image/jpeg,
                      image/jpg,
                      image/webp
                    "
                    onChange={
                      handleLogoUpload
                    }
                    className="
                      hidden-file-input
                    "
                  />

                </label>

                <button
                  type="button"
                  className="
                    remove-logo-button
                  "
                  onClick={removeLogo}
                >
                  Remove
                </button>

              </div>

            </div>

          )}

          {/* =================================
              LOGO PLACEMENT RULES
              ================================= */}

          {!hasLogoChocolate && (

            <div className="rule-card">

              <strong>
                Placement Recommendation
              </strong>

              <p>
                Add logo chocolates near
                the center of the box for
                the strongest presentation.
              </p>

              <p className="recommended-spots">
                Recommended positions:{' '}
                {recommendedLogoPositions.join(', ')}
              </p>

            </div>

          )}

          {hasLogoChocolate &&
            logosAreCorrectlyPlaced && (

              <div
                className="
                  rule-card
                  placement-approved
                "
              >

                <strong>
                  ✓ Logo Placement Approved
                </strong>

                <p>
                  Your logo chocolates are
                  positioned in the
                  recommended center area.
                </p>

                <p className="logo-location">
                  Current positions:{' '}
                  {logoPositions.join(', ')}
                </p>

              </div>

            )}

          {hasLogoChocolate &&
            !logosAreCorrectlyPlaced && (

              <div
                className="
                  rule-card
                  placement-warning
                "
              >

                <strong>
                  ⚠ Logo Placement Recommendation
                </strong>

                <p>
                  Move logo chocolates
                  toward the center for
                  better presentation.
                </p>

                <p className="logo-location">
                  Current positions:{' '}
                  {logoPositions.join(', ')}
                </p>

                <p className="recommended-spots">
                  Recommended positions:{' '}
                  {recommendedLogoPositions.join(', ')}
                </p>

              </div>

            )}

        </section>

      </main>

    </div>
  )
}

export default App
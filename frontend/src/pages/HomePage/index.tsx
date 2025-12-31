import { BootstrapBreadcrumbs } from '../../components/Breadcrumbs/index';
import { usePathPrefix } from '../../hooks/usePathPrefix';


// Иконки
const MouseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="4" width="6" height="12" rx="3" ry="3" />
    <path d="M12 9v3" />
    <rect x="5" y="3" width="14" height="18" rx="7" ry="7" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14m-7-7l7 7 7-7" />
  </svg>
);

export const Home = () => {
  const pathPrefix = usePathPrefix();
  return (
    <>
      {/* === BREADCRUMBS — СТИЛЬ STARBUCKS === */}
      <div className="hero-wrapper" style={{ padding: '0px 20px', backgroundColor: '#422711' }}>
        <div className="container-camo" style={{ padding: '20px 0px' }}>
          <BootstrapBreadcrumbs />
        </div>
      </div>

      {/* === HERO — STARBUCKS STYLE === */}
      <div className="hero-wrapper" style={{ backgroundColor: '#422711', color: 'white' }}>
        <section className="hero-starbucks">
          <div className="hero-content-starbucks">
            <h1 className="hero-title-starbucks-top">
              Cоздай дом мечты!<br />
            </h1>
            <h1 className="hero-title-starbucks">
              Ваш расчёт утеплителя <br />
              <span className="highlight-starbucks">стал точнее</span>
            </h1>
            <p className="hero-subtitle-starbucks">
              Мы помогаем выбрать идеальную толщину утеплителя для вашего дома или квартиры.
              <br />
              Точный расчёт за 3 секунды. Без ошибок. Без переплат.
            </p>
          </div>

          <div className="hero-illustration-starbucks">
            <img src={`${pathPrefix}/b49f4458d655044b4810feb7a5eb45bd.png`} alt="Расчёт утеплителя" />
            
            
          </div>

          <div className="scroll-hint-starbucks">
            <MouseIcon />
            <span>Листайте вниз</span>
            <ArrowDownIcon />
          </div>
        </section>
      </div>

      {/* === ПРЕИМУЩЕСТВА — STARBUCKS GRID === */}
      <section className="services-starbucks">
        <div className="container-camo">
          <div className="section-header-starbucks">
            <h2>Почему выбирают нас</h2>
            <p>
              14 лет опыта и более 400 выполненных проектов — <br />
              мы знаем, как сделать ваш дом тёплым и энергоэффективным
            </p>
          </div>

          <div className="services-grid-starbucks">
            {[
              {
                icon: `${pathPrefix}/gas-kvas-com-p-znachok-kalkulyatora-na-prozrachnom-fone-34.png`,
                title: 'Мгновенный расчёт',
                desc: 'Толщина, материал, стоимость — за 3 секунды',
              },
              {
                icon: `${pathPrefix}/196-1962781_download.png`,
                title: 'PDF-отчёт',
                desc: 'Готовый документ для клиента или подрядчика',
              },
              {
                icon: `${pathPrefix}/4d2cbe89c434d2b8ce083ff9d23e7a40.png`,
                title: 'Соответствие нормам',
                desc: 'Учитываем СНиП, СП и региональные требования',
              },
              {
                icon: `${pathPrefix}/1622187690_preview_anonymous.png`,
                title: 'Поддержка 24/7',
                desc: 'Консультация инженера в любое время',
              },
            ].map((s, i) => (
              <div key={i} className="service-card-starbucks">
                <div className="icon-wrapper-starbucks">
                  <img src={s.icon} alt="" />
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
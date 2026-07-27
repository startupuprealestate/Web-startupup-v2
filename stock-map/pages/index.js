import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  Home, MapPin, Hammer, CheckCircle, Users, RefreshCw, ChevronRight, ChevronDown,
  Search, AlertTriangle, Layers, ArrowLeft, ExternalLink
} from 'lucide-react';
import { GROUP_META, GROUP_ORDER } from '../lib/stock';

const StockMap = dynamic(() => import('../components/StockMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[420px] lg:h-[520px] grid place-items-center text-gray-400 text-sm">กำลังโหลดแผนที่...</div>,
});

const GROUP_ICONS = { wip: Hammer, ready: CheckCircle, hold: Users };

const formatPrice = (price) => (price ? `฿${price.toLocaleString('th-TH')}` : '—');

const formatUpdated = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const normalize = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');

function StatCard({ icon: Icon, label, value, sub, color, active, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border p-4 transition ${onClick ? 'hover:shadow-md cursor-pointer' : ''} ${active ? 'border-2 shadow-md' : 'border-gray-200'}`}
      style={active ? { borderColor: color } : undefined}
    >
      <div className="flex items-center gap-2 text-[13px] text-gray-500">
        <Icon size={16} style={{ color }} />
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[12px] text-gray-400 mt-0.5">{sub}</div>}
    </Tag>
  );
}

function HouseRow({ house, active, onClick }) {
  const meta = GROUP_META[house.group];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-start gap-2 ${active ? 'bg-brand-light border-brand-green' : 'bg-white border-gray-100 hover:border-gray-300'}`}
    >
      <span className="mt-1.5 w-2 h-2 rounded-full flex-none" style={{ background: meta.color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-gray-800 truncate">
          บ้านเลขที่ {house.houseNumber || '—'}
        </span>
        <span className="block text-[11px] text-gray-500 truncate">
          {house.rawStatus} · {formatPrice(house.price)}
          {house.style ? ` · ${house.style}` : ''}
        </span>
      </span>
      {house.precision !== 'exact' && (
        <AlertTriangle size={13} className="text-amber-500 mt-1 flex-none" title="ตำแหน่งโดยประมาณ" />
      )}
    </button>
  );
}

export default function StockMapPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupFilter, setGroupFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState({ zone: null, project: null });
  const [activeHouseKey, setActiveHouseKey] = useState(null);
  const [openZones, setOpenZones] = useState({});

  const load = useCallback(async (force) => {
    if (force) setRefreshing(true);
    try {
      const response = await fetch(`/api/stock${force ? '?refresh=1' : ''}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'โหลดข้อมูลไม่สำเร็จ');
      setData(payload);
      setError(payload.stale ? `ใช้ข้อมูลชุดล่าสุดที่แคชไว้ (${payload.error})` : '');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  // กรองตามสถานะและคำค้น แล้วคำนวณยอดใหม่ให้ตรงกับสิ่งที่เห็นบนแผนที่
  const zones = useMemo(() => {
    if (!data) return [];
    const term = normalize(search);

    return data.zones
      .map((zone) => {
        const projects = zone.projects
          .map((project) => {
            const matchesText = !term
              || normalize(project.name).includes(term)
              || normalize(zone.name).includes(term);
            const houses = project.houses.filter((house) => {
              if (groupFilter && house.group !== groupFilter) return false;
              if (!term) return true;
              return matchesText || normalize(house.houseNumber).includes(term);
            });
            if (!houses.length) return null;
            const counts = GROUP_ORDER.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
            houses.forEach((house) => { counts[house.group] += 1; });
            return { ...project, houses, houseCount: houses.length, counts };
          })
          .filter(Boolean);

        if (!projects.length) return null;
        const counts = GROUP_ORDER.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        projects.forEach((project) => GROUP_ORDER.forEach((key) => { counts[key] += project.counts[key]; }));
        return {
          ...zone,
          projects,
          counts,
          projectCount: projects.length,
          houseCount: projects.reduce((sum, project) => sum + project.houseCount, 0),
        };
      })
      .filter(Boolean);
  }, [data, groupFilter, search]);

  const visible = useMemo(() => {
    const totals = GROUP_ORDER.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    let houses = 0;
    let projects = 0;
    let approximate = 0;
    zones.forEach((zone) => {
      projects += zone.projectCount;
      zone.projects.forEach((project) => project.houses.forEach((house) => {
        houses += 1;
        totals[house.group] += 1;
        if (house.coords && house.precision !== 'exact') approximate += 1;
      }));
    });
    return { totals, houses, projects, zonesCount: zones.length, approximate };
  }, [zones]);

  const handleViewChange = useCallback((next) => {
    setView(next);
    setActiveHouseKey(null);
    if (next.zone) setOpenZones((prev) => ({ ...prev, [next.zone]: true }));
  }, []);

  // ถ้าทำเล/โครงการที่เลือกอยู่หายไปหลังกรอง ให้ถอยกลับไปมุมมองที่ยังมีข้อมูล
  useEffect(() => {
    if (!view.zone) return;
    const zone = zones.find((z) => z.name === view.zone);
    if (!zone) { setView({ zone: null, project: null }); return; }
    if (view.project && !zone.projects.some((p) => p.name === view.project)) {
      setView({ zone: view.zone, project: null });
    }
  }, [zones, view]);

  const activeZone = view.zone ? zones.find((zone) => zone.name === view.zone) : null;
  const activeProject = activeZone && view.project
    ? activeZone.projects.find((project) => project.name === view.project)
    : null;

  const unlocated = useMemo(() => {
    const list = [];
    zones.forEach((zone) => zone.projects.forEach((project) => project.houses.forEach((house) => {
      if (!house.coords) list.push(house);
    })));
    return list;
  }, [zones]);

  return (
    <>
      <Head>
        <title>Startup Up — แผนที่สต๊อกบ้าน</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#f7f8f7] text-gray-900">
        <header className="bg-brand-green text-white">
          <div className="max-w-[1500px] mx-auto px-4 py-5 flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <MapPin size={22} /> แผนที่สต๊อกบ้าน Startup Up
              </h1>
              <p className="text-white/70 text-[13px] mt-1">
                ดูอย่างเดียว · ข้อมูลจาก Master Stock (แท็บ Stockบ้าน) เฉพาะบ้านของ Startup Up ที่ยังไม่ขาย
              </p>
            </div>
            <div className="flex items-center gap-3">
              {data && (
                <span className="text-white/60 text-[12px] hidden sm:block">
                  อัปเดต {formatUpdated(data.updatedAt)}
                </span>
              )}
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-full px-4 py-2 text-[13px] flex items-center gap-2 transition"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                ดึงข้อมูลใหม่
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1500px] mx-auto px-4 py-5">
          {error && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-[13px] flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 flex-none" /> {error}
            </div>
          )}

          {loading ? (
            <div className="h-[60vh] grid place-items-center text-gray-400">กำลังโหลดข้อมูลจาก Master Stock...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard
                  icon={Home}
                  label="บ้านทั้งหมด"
                  value={visible.houses}
                  sub={`${visible.projects} โครงการ · ${visible.zonesCount} ทำเล`}
                  color="#0b3d1b"
                  active={!groupFilter}
                  onClick={() => setGroupFilter(null)}
                />
                {GROUP_ORDER.map((key) => {
                  const meta = GROUP_META[key];
                  const Icon = GROUP_ICONS[key];
                  return (
                    <StatCard
                      key={key}
                      icon={Icon}
                      label={meta.label}
                      value={visible.totals[key]}
                      sub={meta.desc}
                      color={meta.color}
                      active={groupFilter === key}
                      onClick={() => setGroupFilter(groupFilter === key ? null : key)}
                    />
                  );
                })}
                <StatCard
                  icon={AlertTriangle}
                  label="ตำแหน่งโดยประมาณ"
                  value={visible.approximate}
                  sub={`อ้างอิงจุดกึ่งกลางโครงการ/ทำเล${unlocated.length ? ` · ไม่มีพิกัดเลย ${unlocated.length} หลัง` : ''}`}
                  color="#b45309"
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-4 mt-4">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 text-[13px]">
                    <button
                      onClick={() => handleViewChange({ zone: null, project: null })}
                      className={`flex items-center gap-1 ${view.zone ? 'text-brand-green hover:underline' : 'text-gray-400 cursor-default'}`}
                      disabled={!view.zone}
                    >
                      <Layers size={15} /> ทุกทำเล
                    </button>
                    {view.zone && (
                      <>
                        <ChevronRight size={14} className="text-gray-300" />
                        <button
                          onClick={() => handleViewChange({ zone: view.zone, project: null })}
                          className={view.project ? 'text-brand-green hover:underline' : 'text-gray-700 font-medium cursor-default'}
                          disabled={!view.project}
                        >
                          {view.zone}
                        </button>
                      </>
                    )}
                    {view.project && (
                      <>
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="text-gray-700 font-medium">{view.project}</span>
                      </>
                    )}
                    <span className="ml-auto flex items-center gap-3 text-[12px] text-gray-500">
                      {GROUP_ORDER.map((key) => (
                        <span key={key} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_META[key].color }} />
                          {GROUP_META[key].label}
                        </span>
                      ))}
                    </span>
                  </div>

                  {view.zone && (
                    <div className="px-4 py-2 bg-brand-light/60 text-[12px] text-brand-green flex items-center gap-2">
                      <button
                        onClick={() => handleViewChange(view.project ? { zone: view.zone, project: null } : { zone: null, project: null })}
                        className="flex items-center gap-1 font-medium hover:underline"
                      >
                        <ArrowLeft size={13} /> ย้อนกลับ
                      </button>
                      <span className="text-gray-500">
                        {activeProject
                          ? `${activeProject.name} · ${activeProject.houseCount} หลัง`
                          : activeZone && `${activeZone.name} · ${activeZone.projectCount} โครงการ · ${activeZone.houseCount} หลัง`}
                      </span>
                    </div>
                  )}

                  <StockMap
                    zones={zones}
                    view={view}
                    onViewChange={handleViewChange}
                    activeHouseKey={activeHouseKey}
                  />
                </section>

                <aside className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาทำเล / โครงการ / บ้านเลขที่"
                        className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg border border-gray-200 focus:border-brand-green outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[520px] lg:max-h-[calc(100vh-320px)]">
                    {!zones.length && (
                      <p className="p-6 text-center text-gray-400 text-[13px]">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
                    )}

                    {zones.map((zone) => {
                      const open = openZones[zone.name] || view.zone === zone.name;
                      return (
                        <div key={zone.name} className="border-b border-gray-100">
                          <button
                            onClick={() => {
                              setOpenZones((prev) => ({ ...prev, [zone.name]: !open }));
                              handleViewChange({ zone: zone.name, project: null });
                            }}
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition ${view.zone === zone.name ? 'bg-brand-light' : 'hover:bg-gray-50'}`}
                          >
                            {open ? <ChevronDown size={15} className="text-gray-400 flex-none" /> : <ChevronRight size={15} className="text-gray-400 flex-none" />}
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] font-medium text-gray-800 truncate">{zone.name}</span>
                              <span className="block text-[11px] text-gray-500">
                                {zone.projectCount} โครงการ · {zone.houseCount} หลัง
                              </span>
                            </span>
                            <span className="flex gap-1 flex-none">
                              {GROUP_ORDER.filter((key) => zone.counts[key] > 0).map((key) => (
                                <span
                                  key={key}
                                  title={GROUP_META[key].label}
                                  className="text-[11px] font-semibold text-white rounded-full px-1.5 py-0.5 min-w-[22px] text-center"
                                  style={{ background: GROUP_META[key].color }}
                                >
                                  {zone.counts[key]}
                                </span>
                              ))}
                            </span>
                          </button>

                          {open && (
                            <div className="pb-2">
                              {zone.projects.map((project) => {
                                const projectOpen = view.zone === zone.name && view.project === project.name;
                                return (
                                  <div key={project.name} className="px-3">
                                    <button
                                      onClick={() => handleViewChange(
                                        projectOpen ? { zone: zone.name, project: null } : { zone: zone.name, project: project.name }
                                      )}
                                      className={`w-full text-left pl-4 pr-2 py-1.5 rounded-lg flex items-center gap-2 transition ${projectOpen ? 'bg-brand-green text-white' : 'hover:bg-gray-50'}`}
                                    >
                                      <span className="min-w-0 flex-1 truncate text-[13px]">{project.name}</span>
                                      <span className={`text-[11px] flex-none ${projectOpen ? 'text-white/80' : 'text-gray-500'}`}>
                                        {project.houseCount} หลัง
                                      </span>
                                      {project.counts.wip > 0 && (
                                        <span
                                          className="text-[10px] font-semibold text-white rounded-full px-1.5 flex-none"
                                          style={{ background: GROUP_META.wip.color }}
                                          title={`ยังไม่เสร็จ ${project.counts.wip} หลัง`}
                                        >
                                          {project.counts.wip}
                                        </span>
                                      )}
                                    </button>

                                    {projectOpen && (
                                      <div className="pl-4 py-2 space-y-1.5">
                                        {project.houses.map((house) => (
                                          <HouseRow
                                            key={house.rowIndex}
                                            house={house}
                                            active={activeHouseKey === house.rowIndex}
                                            onClick={() => setActiveHouseKey(
                                              activeHouseKey === house.rowIndex ? null : house.rowIndex
                                            )}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </aside>
              </div>

              {unlocated.length > 0 && (
                <section className="mt-4 bg-white rounded-2xl border border-amber-200 p-4">
                  <h2 className="text-[14px] font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={16} /> บ้านที่ยังไม่มีพิกัดบนแผนที่ ({unlocated.length} หลัง)
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-1">
                    ไม่มีลิงก์ Google Maps ในคอลัมน์ Location และไม่พบบ้าน/โครงการนี้ในเว็บหลัก — เพิ่มลิงก์ในชีตแล้วกด “ดึงข้อมูลใหม่” จะขึ้นแผนที่ทันที
                  </p>
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {unlocated.map((house) => (
                      <div key={house.rowIndex} className="text-[12px] border border-gray-100 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-800">{house.project}</span>
                        <span className="text-gray-500"> · {house.houseNumber || '—'}</span>
                        <span className="block text-gray-400">
                          {house.zone || 'ไม่ระบุทำเล'} · {house.rawStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data && (
                <footer className="mt-6 text-center text-[12px] text-gray-400 pb-6">
                  ที่มา: Google Sheet “Stockบ้าน” · พิกัดจากลิงก์ Location ในชีต เสริมด้วยพิกัดบ้านจากเว็บหลัก ·{' '}
                  <a href={data.sheetUrl} target="_blank" rel="noreferrer" className="text-brand-green hover:underline inline-flex items-center gap-1">
                    เปิดชีตต้นทาง <ExternalLink size={11} />
                  </a>
                </footer>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

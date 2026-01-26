import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Dashboard() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchDateStart, setSearchDateStart] = useState('');
    const [searchDateEnd, setSearchDateEnd] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                // Using the specific route requested/modified by user in previous steps
                const response = await client.get(`/reservations/user/${user.id || user._id || '6970110bba82103cd00f7651'}`);
                // Fallback ID used from user's manual edit history if user object doesn't have ID
                setReservations(response.data);
            } catch (error) {
                console.error("Failed to fetch reservations", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchReservations();
        }
    }, [user]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        try {
            const response = await client.get('/rooms/available', {
                params: {
                    start_date: searchDateStart,
                    end_date: searchDateEnd
                }
            });
            setAvailableRooms(response.data);
        } catch (error) {
            console.error("Search failed", error);
            alert("Failed to find rooms");
        } finally {
            setSearching(false);
        }
    };

    const bookRoom = async (room) => {
        if (!confirm(`Book ${room.room_type} for $${room.price}?`)) return;

        try {
            const data = {
                user_id: user.id || user._id || '6970110bba82103cd00f7651',
                room_id: room.id, // The API expects room_id to be the number based on schema logic seen typically, or _id? 
                // Reviewing routes.py: existing_booking checks "room_id": booking.room_id.
                // room collection has "room_number".
                // Let's assume room_number is the identifier.
                start_date: searchDateStart,
                end_date: searchDateEnd
            };
            await client.post('/reservations', data);

            alert("Reservation Created!");
            setIsModalOpen(false);
            setAvailableRooms([]);

            // Refresh list
            const response = await client.get(`/reservations/user/${user.id || user._id || '6970110bba82103cd00f7651'}`);
            setReservations(response.data);
        } catch (error) {
            console.error("Create failed", error);
            alert("Failed to create reservation: " + (error.response?.data?.detail || error.message));
        }
    };

    if (!user) return <div className="p-10 text-center">Please login.</div>;

    return (
        <div className="space-y-6">
            <header className="bg-white shadow rounded-lg p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Your Reservations</h1>
                    <p className="text-gray-500 mt-1">Manage your upcoming stays</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                    Book New Stay
                </button>
            </header>

            {/* List Reservations */}
            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {reservations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No reservations found. Book your first stay!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {reservations.map((res, idx) => (
                                <li key={res._id || idx} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="text-lg font-medium text-gray-900">Room {res.room_id}</p>
                                            <p className="text-sm text-gray-600">{res.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                {new Date(res.start_date).toLocaleDateString()} - {new Date(res.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
                            <div className="bg-white p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                    Find Available Rooms
                                </h3>

                                {/* Date Search Form */}
                                <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Check In</label>
                                        <input
                                            type="date"
                                            required
                                            value={searchDateStart}
                                            onChange={e => setSearchDateStart(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Check Out</label>
                                        <input
                                            type="date"
                                            required
                                            value={searchDateEnd}
                                            onChange={e => setSearchDateEnd(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={searching}
                                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {searching ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>
                                </form>

                                {/* Results */}
                                <div className="mt-4 max-h-60 overflow-y-auto">
                                    {availableRooms.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {availableRooms.map((room) => (
                                                <li key={room.id} className="py-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Room {room.room_number}</p>
                                                        <p className="text-sm text-gray-500">{room.room_type} &bull; ${room.price}/night</p>
                                                    </div>
                                                    <button
                                                        onClick={() => bookRoom(room)}
                                                        className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                    >
                                                        Book Now
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            {searchDateStart && searchDateEnd && !searching ? "No rooms available." : "Select dates to see rooms."}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="fixed inset-0 bg-gray-500/50 transition-opacity z-[-10]" onClick={() => setIsModalOpen(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                    </div>
                </div>
            )}
        </div>
    );
}

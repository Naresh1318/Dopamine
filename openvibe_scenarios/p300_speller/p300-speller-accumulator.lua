
function arrayMax(a)
    if #a == 0 then return nil, nil end
    local maxIdx, maxValue = 0, a[0]
    for i = 1, (#a -1 ) do
        if maxValue < a[i] then
            maxIdx, maxValue = i, a[i]
        end
    end
    return maxIdx, maxValue
end

-- For handling target fifo

List = {}
function List.new ()
	return {first = 0, last = -1}
end

function List.pushright (list, value)
	local last = list.last + 1
	list.last = last
	list[last] = value
end

function List.popleft (list)
	local first = list.first
	if first > list.last then
		error("list is empty") 
	end
	local value = list[first]
	list[first] = nil        -- to allow garbage collection
	list.first = first + 1
	return value
end

function List.isempty (list)
	if list.first > list.last  then
		return true
	else
		return false
	end
end

-- this function is called when the box is initialized
function initialize(box)

	dofile(box:get_config("${Path_Data}") .. "/plugins/stimulation/lua-stimulator-stim-codes.lua")

	row_base = _G[box:get_setting(2)]
	col_base = _G[box:get_setting(3)]
	segment_start = _G[box:get_setting(4)]
	segment_stop = _G[box:get_setting(5)]
	
	-- 0 inactive, 1 segment started, 2 segment stopped (can vote)
	segment_status = 0

	-- the idea is to push the flash states to the fifo, and when predictions arrive (with some delay), they are matched in oldest-first fashion.
	target_fifo = List.new()
	
	-- box:log("Info", string.format("pop %d %d", id[1], id[2]))
					
	row_votes = {}
	col_votes = {}
	
	do_debug = true
	
end

-- this function is called when the box is uninitialized
function uninitialize(box)
       
end
		
function process(box)
	-- loops until box is stopped
	while box:keep_processing() do
		
		-- first, parse the timeline stream
		for stimulation = 1, box:get_stimulation_count(2) do
			-- gets the received stimulation
			local identifier, date, duration = box:get_stimulation(2, 1)
			-- discards it
			box:remove_stimulation(2, 1)			

			if identifier == segment_start then
				if do_debug then
					-- box:log("Info", string.format("Trial start"))	
					-- box:log("Info", string.format("Clear votes"))
				end
				-- zero the votes
				col_votes = {}
				row_votes = {}
				target_fifo = List.new()
				-- fixme fixed 20
				for i = 0,20 do
					col_votes[i] = 0
					row_votes[i] = 0
				end
				segment_status = 1
			end

			-- Does the identifier code a flash? if so, put into fifo
			if segment_status == 1 and identifier >= row_base and identifier <= OVTK_StimulationId_LabelEnd then
			
				-- assume rows before cols
				if identifier < col_base then
					local t = {"row", identifier - row_base}
					List.pushright(target_fifo,t)
					if do_debug then	
						-- box:log("Info", string.format("Push row target %d", identifier - row_base ))		
					end
				else
					local t = {"col", identifier - col_base}
					List.pushright(target_fifo,t)	
					if do_debug then	
						-- box:log("Info", string.format("Push col target %d", identifier - col_base ))		
					end
				end
				
						
			end

			if identifier == segment_stop then
				if do_debug then
					-- box:log("Info", string.format("Trial stop"))
				end
				segment_status = 2
			end

		end
		
		-- then parse the classifications
		for stimulation = 1, box:get_stimulation_count(1) do

			-- gets the received stimulation
			local identifier, date, duration = box:get_stimulation(1, 1)
			-- discards it
			box:remove_stimulation(1, 1)

			-- Is it an in-class prediction?
			if identifier == OVTK_StimulationId_Target then
				local t = List.popleft(target_fifo)
				if do_debug then
					-- box:log("Info", string.format("Pred fifo %s %d is target", t[1], t[2]))
				end
				if t[1]=="row" then
					row_votes[t[2]] = row_votes[t[2]] + 1
				else
					col_votes[t[2]] = col_votes[t[2]] + 1				
				end
			end
			
			if identifier == OVTK_StimulationId_NonTarget then
				local t = List.popleft(target_fifo)
				if do_debug then
					-- box:log("Info", string.format("Pred fifo %s %d is nontarget", t[1], t[2]))			
				end
			end
			
		end
		
		if segment_status == 2 and List.isempty(target_fifo) then
			-- output the vote after the segment end when we've matched all predictions
			
			local maxRowIdx, maxRowValue = arrayMax(row_votes)
			local maxColIdx, maxColValue = arrayMax(col_votes)

			if maxRowValue == 0 and maxColValue == 0 then
				box:log("Warning", string.format("Classifier predicted 'no p300' for all flashes of the trial"));
			end
			
			if do_debug then
				local rowVotes = 0
				local colVotes = 0
				for ir, val in pairs(row_votes) do
					rowVotes = rowVotes + val
				end
				for ir, val in pairs(col_votes) do
					colVotes = colVotes + val
				end
			
				-- box:log("Info", string.format("Voting_Result [%d %d] wt [%d,%d]", maxRowIdx, maxColIdx, maxRowValue, maxColValue))	
				box:log("Info", string.format("Voting_Result [%d %d]", maxRowIdx, maxColIdx, maxRowValue, maxColValue))
				-- box:log("Info", string.format("  Total [%d %d]", rowVotes, colVotes))
			end
			

			
			local now = box:get_current_time()
			
			box:send_stimulation(1, maxRowIdx + row_base, now, 0)
			box:send_stimulation(2, maxColIdx + col_base, now, 0)
					
			segment_status = 0
		end		

		box:sleep()
	end
end

